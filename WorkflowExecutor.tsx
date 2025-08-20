import React, { useState, useEffect } from 'react';
import { Node, Connection } from '../types/NodeTypes';
import { logger } from '../utils/logging';
import { WorkflowDAG } from '../engine/graph';
import { CycleDetectedError } from '../engine/graph';
import { ConfigOrchestrator } from '../engine/configOrchestrator';
import { initializeTracing, getTracer, withSpan } from '../lib/tracing';

interface WorkflowExecutorProps {
  nodes: Node[];
  connections: Connection[];
  apiKeys: any;
  onNodeUpdate: (nodeId: string, data: any) => void;
  onExecutionUpdate: (status: string, nodeId?: string, result?: any) => void;
}

export default function WorkflowExecutor({ 
  nodes, 
  connections, 
  apiKeys, 
  onNodeUpdate, 
  onExecutionUpdate 
}: WorkflowExecutorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Map<string, any>>(new Map());
  const [executionStartTimes, setExecutionStartTimes] = useState<Map<string, Date>>(new Map());
  const [runId, setRunId] = useState<string | null>(null);
  const [configOrchestrator, setConfigOrchestrator] = useState<ConfigOrchestrator | null>(null);


  const executeNode = async (nodeId: string, currentRunResults?: Map<string, any>) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Skip all preview nodes - they don't execute, they just display
    if (node.type === 'preview-node' || 
        node.type === 'image-preview-node' || 
        node.type === 'audio-preview-node' || 
        node.type === 'video-preview-node' || 
        node.type === 'text-preview-node') {
      logger.debug('execution', 'Skipping preview node', nodeId);
      return null;
    }

    const startTime = new Date();
    setCurrentNode(nodeId);
    setExecutionStartTimes(prev => new Map(prev.set(nodeId, startTime)));
    onExecutionUpdate('executing', nodeId);
    
    logger.info('execution', `Starting execution of ${node.type} node`, nodeId, {
      nodeType: node.type,
      nodeData: Object.keys(node.data),
      startTime: startTime.toISOString()
    });

    try {
      // Get input data from connected nodes
      const inputConnections = connections.filter(conn => conn.targetId === nodeId);
      const inputData = {};
      
      // Use currentRunResults if provided (for synchronized execution), otherwise fall back to component state
      const resultsMap = currentRunResults || executionResults;
      
      for (const conn of inputConnections) {
        const sourceResult = resultsMap.get(conn.sourceId);
        if (sourceResult) {
          inputData[conn.sourceId] = sourceResult;
          logger.debug('data-flow', `Input data received from ${conn.sourceId}`, nodeId, {
            sourceNodeId: conn.sourceId,
            dataKeys: Object.keys(sourceResult),
            dataSize: JSON.stringify(sourceResult).length
          });
        }
      }
      
      logger.debug('execution', 'Node configuration and input data prepared', nodeId, {
        nodeConfiguration: Object.keys(node.data),
        inputConnections: inputConnections.length,
        availableResults: Array.from(resultsMap.keys()),
        inputDataKeys: Object.keys(inputData)
      });
      
      const r = await fetch('/api/execute-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: node.type,
          payload: node.data,
          apiKeys,
          inputData,
          nodeId,
          runId
        })
      });

      logger.debug('api', 'API response received', nodeId, {
        status: r.status,
        statusText: r.statusText,
        url: r.url
      });
      
      const raw = await r.text();
      let data: any = undefined;
      try { data = raw ? JSON.parse(raw) : undefined; } catch {}

      logger.debug('api', 'Response data parsed', nodeId, {
        responseSize: raw.length,
        dataKeys: data ? Object.keys(data) : [],
        hasResult: !!data?.result || !!data?.data,
        ok: data?.ok
      });

      if (!r.ok) {
        if (r.status === 401 && node.type === 'voice-generator') {
          const errorMsg = 'ElevenLabs API authentication failed. Please check your API key in Settings.';
          logger.error('auth', `Authentication failed: ${errorMsg}`, nodeId, { 
            errorType: 'authentication', 
            service: 'ElevenLabs' 
          });
          onExecutionUpdate('error', nodeId, { error: errorMsg });
          return { error: errorMsg };
        } else {
          const msg = data?.error || `HTTP ${r.status} ${r.statusText}`;
          const fullError = `${msg} — ${data?.details ? JSON.stringify(data.details) : 'no details'}`;
          logger.error('api', `HTTP Error: ${fullError}`, nodeId, { 
            httpStatus: r.status,
            errorDetails: data?.details,
            rawResponse: raw.substring(0, 500)
          });
          throw new Error(fullError);
        }
      }

      // Handle both old format (data.ok) and new format (data.result)
      const result = data.result || data.data || data;
      
      if (data.ok !== false) {
        setExecutionResults(prev => new Map(prev.set(nodeId, result)));
        onNodeUpdate(nodeId, { ...node.data, lastResult: result });
        
        const executionTime = Date.now() - startTime.getTime();
        logger.success('execution', `Node execution completed successfully in ${executionTime}ms`, nodeId, {
          executionTime: `${executionTime}ms`,
          resultKeys: result ? Object.keys(result) : [],
          resultSize: result ? JSON.stringify(result).length : 0
        });
        
        // Apply intelligent configurations
        if (result.nodeConfigurations) {
          logger.info('config', 'Applying intelligent configurations to downstream nodes', nodeId, {
            configurationsApplied: Object.keys(result.nodeConfigurations),
            configurations: result.nodeConfigurations
          });
          
          // Apply configurations globally to ALL matching node types
          for (const [targetNodeType, nodeConfig] of Object.entries(result.nodeConfigurations)) {
            const matchingNodes = nodes.filter(n => n.type === targetNodeType);
            
            for (const targetNode of matchingNodes) {
              logger.info('config', `Configuring ${targetNode.type} node with intelligent settings`, nodeId, {
                targetNodeId: targetNode.id,
                targetNodeType: targetNode.type,
                appliedConfig: nodeConfig,
                configKeys: Object.keys(nodeConfig as any)
              });
              
              // Apply configuration, merging with existing data
              const updatedData = { ...targetNode.data };
              
              // Apply each configuration field
              Object.entries(nodeConfig as any).forEach(([key, value]) => {
                const oldValue = updatedData[key];
                updatedData[key] = value;
                
                if (oldValue !== value) {
                  logger.debug('config', `Updated ${targetNode.type}.${key}: ${oldValue} → ${value}`, nodeId, { 
                    field: key, 
                    oldValue, 
                    newValue: value 
                  });
                }
              });
              
              // Update the target node with new configuration
              onNodeUpdate(targetNode.id, updatedData);
            }
          }
        }
        
        // Update connected preview nodes
        const connectedPreviewNodes = connections
          .filter(conn => conn.sourceId === nodeId)
          .map(conn => conn.targetId)
          .filter(targetId => {
            const targetNode = nodes.find(n => n.id === targetId);
            return targetNode?.type === 'image-preview-node' || targetNode?.type === 'audio-preview-node' || 
                   targetNode?.type === 'video-preview-node' || targetNode?.type === 'text-preview-node';
          });
        
        connectedPreviewNodes.forEach(previewNodeId => {
          onNodeUpdate(previewNodeId, { lastResult: result });
        });
        
        onExecutionUpdate('completed', nodeId, result);
        return result;
      } else {
        const errorMsg = data.error || 'Node execution failed';
        logger.error('execution', `Node execution failed: ${errorMsg}`, nodeId, { 
          errorMessage: errorMsg,
          responseData: data
        });
        throw new Error(errorMsg);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime.getTime();
      logger.error('execution', `Node execution failed after ${executionTime}ms: ${error instanceof Error ? error.message : String(error)}`, nodeId, {
        executionTime: `${executionTime}ms`,
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      onExecutionUpdate('error', nodeId, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const startWorkflow = async () => {
    const newRunId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setRunId(newRunId);
    logger.setRunId(newRunId);
    
    // Initialize tracing and configuration orchestrator
    const tracer = initializeTracing(newRunId);
    const orchestrator = new ConfigOrchestrator(newRunId);
    setConfigOrchestrator(orchestrator);
    
    if (nodes.length === 0) {
      logger.error('workflow', 'No nodes to execute');
      onExecutionUpdate('error', undefined, { error: 'No nodes to execute' });
      return;
    }
    
    // Create DAG and execution plan
    try {
      const dag = new WorkflowDAG(nodes, connections, newRunId);
      const executionPlan = dag.createExecutionPlan();
      
      logger.info('workflow', 'Execution plan created', undefined, {
        runId: newRunId,
        totalStages: executionPlan.stages.length,
        startNodes: executionPlan.startNodes,
        totalNodes: executionPlan.totalNodes
      });
      
      setIsRunning(true);
      const results = new Map();
      setExecutionResults(results);
      
      await executeWorkflowPlan(executionPlan, orchestrator, results);
    } catch (error) {
      if (error instanceof CycleDetectedError) {
        logger.error('workflow', `Cycle detected in workflow: ${error.message}`, undefined, {
          runId: newRunId,
          cyclePath: error.cyclePath
        });
        onExecutionUpdate('cycle_detected', undefined, { 
          error: error.message, 
          cyclePath: error.cyclePath 
        });
      } else {
      logger.error('workflow', `Failed to create execution plan: ${error.message}`, undefined, {
        runId: newRunId,
        error: error.message
      });
      onExecutionUpdate('error', undefined, { error: error.message });
      }
      setIsRunning(false);
      setCurrentNode(null);
      logger.clearRunId();
      setRunId(null);
    }
  }



  const executeWorkflowPlan = async (plan: any, orchestrator: ConfigOrchestrator, results: Map<string, any>) => {
    logger.info('workflow', `Starting workflow execution with ${plan.totalNodes} nodes`, undefined, {
      runId,
      totalStages: plan.stages.length,
      startTime: new Date().toISOString()
    });
    
    onExecutionUpdate('started');

    try {
      // Execute stages in order
      for (let stageIndex = 0; stageIndex < plan.stages.length; stageIndex++) {
        const stage = plan.stages[stageIndex];
        
        logger.info('workflow', `Executing stage ${stageIndex + 1}/${plan.stages.length}`, undefined, {
          runId,
          stageId: stage.id,
          nodeCount: stage.nodeIds.length,
          nodes: stage.nodeIds
        });

        // Configuration phase
        const configSnapshot = orchestrator.resolveConflicts(stage.id);
        
        // Execute nodes in this stage
        for (const nodeId of stage.nodeIds) {
          // Skip all preview nodes in execution
          const node = nodes.find(n => n.id === nodeId);
          if (node?.type === 'preview-node' || 
              node?.type === 'image-preview-node' || 
              node?.type === 'audio-preview-node' || 
              node?.type === 'video-preview-node' || 
              node?.type === 'text-preview-node') {
            logger.debug('execution', 'Skipping preview node', nodeId, { runId });
            continue;
          }
          
          // Skip file input nodes if they have no uploaded file
          if (node?.type === 'file-input-node' && !node.data?.uploadedFile) {
            logger.warn('execution', 'Skipping file input node - no file uploaded', nodeId, { runId });
            continue;
          }

          // Skip LoRA training nodes if they don't have enough training images
          if (node?.type === 'lora-training-node') {
            const trainingImages = node.data?.trainingImages || [];
            if (trainingImages.length < 5) {
              // Re-populate with default training images from template
              const defaultTrainingImages = [
                { url: "/uploads/cached-1755150381023-83ca8adb.png", name: "Viktor_upper body_side.png" },
                { url: "/uploads/cached-1755150381024-f4b2c9e1.png", name: "Viktor_full_body_front.png" },
                { url: "/uploads/cached-1755150381025-a7d8e3f2.png", name: "Viktor_headshot_angle.png" },
                { url: "/uploads/cached-1755150381026-b9c4f5g3.png", name: "Viktor_profile_left.png" },
                { url: "/uploads/cached-1755150381027-c1e6h7i4.png", name: "Viktor_casual_pose.png" }
              ];
              
              logger.info('execution', `Re-populating LoRA training node with default images (${defaultTrainingImages.length} images)`, nodeId, { runId });
              
              // Update node data with default training images
              const updatedNodeData = { ...node.data, trainingImages: defaultTrainingImages };
              onNodeUpdate(nodeId, updatedNodeData);
              
              // Update the node reference for this execution
              node.data = updatedNodeData;
            }
          }

          // Skip LoRA nodes if they don't have a selected model
          if (node?.type === 'lora-node') {
            const selectedModel = node.data?.selectedModel;
            if (!selectedModel) {
              logger.warn('execution', 'Skipping LoRA node - no trained model selected', nodeId, { runId });
              onExecutionUpdate('skipped', nodeId, { 
                error: 'No trained LoRA model selected. Please train a model first or select an existing one.',
                reason: 'no_model_selected'
              });
              continue;
            }
          }

          logger.info('execution', `Executing node: ${nodeId}`, nodeId, {
            runId,
            stageIndex: stageIndex + 1,
            totalStages: plan.stages.length,
            nodeType: node?.type
          });
          
          // Get input data from connected nodes, organized by port
          const inputConnections = connections.filter(conn => conn.targetId === nodeId);
          const inputData = {};
          
          for (const conn of inputConnections) {
            const sourceResult = results.get(conn.sourceId);
            if (sourceResult) {
              const targetPort = conn.targetPort || 0;
              const sourcePort = conn.sourcePort || 0;
              
              // Extract the right data from source result
              let portData = sourceResult;
              const sourceNode = nodes.find(n => n.id === conn.sourceId);
              
              if (sourceNode && sourceNode.type === 'judgment-node') {
                if (sourceResult.outputs && Array.isArray(sourceResult.outputs)) {
                  portData = sourceResult.outputs[sourcePort];
                } else {
                  portData = null;
                }
              } else if (sourceResult.outputs && Array.isArray(sourceResult.outputs)) {
                portData = sourceResult.outputs[sourcePort] || sourceResult;
              } else if (sourceResult.outputs && typeof sourceResult.outputs === 'object') {
                // Handle named outputs (script/prompts)
                const portKey = String(sourcePort);
                if (sourceResult.outputs[portKey] !== undefined) {
                  portData = sourceResult.outputs[portKey];
                } else {
                  // Try common aliases
                  const aliases = { 
                    '0': ['script', 'text', 'yes', 'primary', 'default'], 
                    '1': ['prompts', 'no', 'secondary'] 
                  };
                  const found = (aliases[portKey] || []).find(k => sourceResult.outputs[k] !== undefined);
                  portData = found ? sourceResult.outputs[found] : (sourceResult.outputs.default || sourceResult);
                }
              }
              
              // Only add to inputData if portData is not null
              if (portData !== null) {
                inputData[conn.sourceId] = portData;
              }
            }
          }
          
          // Apply effective configuration
          const effectiveConfig = configSnapshot.effectiveConfig;
          
          const result = await withSpan(`execute-${node?.type}`, nodeId, async (spanId) => {
            return await executeNode(nodeId, results);
          });
          
          // Store result in our local map
          if (result) {
            results.set(nodeId, result);
          }
          
          // Small delay between nodes for better UX
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      const tracer = getTracer();
      const executionSummary = tracer?.getExecutionSummary();
      
      logger.success('workflow', 'Workflow execution completed successfully', undefined, {
        runId,
        totalStagesExecuted: plan.stages.length,
        totalResults: results.size,
        completionTime: new Date().toISOString(),
        executionSummary
      });
      
      onExecutionUpdate('finished');
    } catch (error) {
      logger.error('workflow', `Workflow execution failed: ${error.message}`, currentNode || undefined, {
        runId,
        errorMessage: error instanceof Error ? error.message : String(error),
        failedAt: currentNode,
        completedNodes: Array.from(results.keys()),
        failureTime: new Date().toISOString()
      });
      
      onExecutionUpdate('failed', undefined, { error: error.message });
    } finally {
      setIsRunning(false);
      setCurrentNode(null);
      setConfigOrchestrator(null);
      logger.clearRunId();
      setRunId(null);
    }
  };


  const stopWorkflow = () => {
    setIsRunning(false);
    setCurrentNode(null);
    setConfigOrchestrator(null);
    logger.clearRunId();
    setRunId(null);
    onExecutionUpdate('stopped');
  };

  const resetWorkflow = () => {
    setExecutionResults(new Map());
    setCurrentNode(null);
    setConfigOrchestrator(null);
    logger.clearRunId();
    setRunId(null);
    onExecutionUpdate('reset');
  };


  return {
    isRunning,
    currentNode,
    executionResults,
    executionStartTimes,
    configOrchestrator,
    startWorkflow,
    stopWorkflow,
    resetWorkflow
  };
}