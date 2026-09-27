# Snapdragon AI Smart Process & Task Manager

## Solution Overview

Snapdragon AI Smart Process & Task Manager is a safety-first AI workload intelligence system designed and intended to be optimized for **Snapdragon-powered HP PCs running Windows 11 on Arm**.

The solution continuously observes system workloads and process activity, extracts workload characteristics, and uses a lightweight **11-feature ONNX neural-network model** to classify processes into protection and optimization states. A calibrated confidence layer and out-of-distribution familiarity detection help the system become more conservative when workloads are uncertain.

The architecture is designed around the heterogeneous capabilities of Snapdragon-powered PCs, with **Qualcomm Snapdragon Hexagon NPU** acceleration as the target execution path for AI inference. When Snapdragon NPU hardware is unavailable, the application uses a CPU fallback while preserving the same AI and safety architecture.

## Snapdragon Optimization

The solution is specifically designed for the Snapdragon PC environment by targeting:

- Windows 11 on Arm
- Snapdragon CPU/GPU/NPU architecture
- Qualcomm Hexagon NPU for AI inference
- ONNX model deployment
- Qualcomm AI Hub validation and profiling

Application architecture and runtime characteristics are treated as workload signals rather than assuming that any particular architecture is inherently better or worse.

## Qualcomm Snapdragon Validation

The ONNX model was validated through Qualcomm AI Hub on a **Snapdragon X Elite reference platform**.

Verified evidence includes:

**Compile:** `jp0m9yd0g`
**Profile:** `jpxlrj1lp`
**Inference:** `j5wlrew3p`

The profiling evidence shows **10/10 executed model nodes running on the NPU**, and inference validation achieved **4/4 CPU/NPU output agreement** with a maximum probability difference of **0.0015**.

This is **model-level validation on Snapdragon reference hardware**. Full end-to-end validation of the complete application on a physical HP Snapdragon PC remains a hardware-dependent deployment step.

## Safety-First Design

The architecture separates AI prediction from deterministic safety decisions:

**Observe → Understand → Predict → Confidence/OOD → Safety → Recommendation**

The AI predicts workload behavior, while the safety engine decides whether a workload should be:

- **PROTECT**
- **OBSERVE**
- **REVIEW**
- **OPTIMIZATION CANDIDATE**

The system is recommendation-only and non-destructive. It does not kill, terminate, suspend, or otherwise modify Windows processes.

## Optimization and Deployment Intent

The solution is intended to operate as an intelligent resource-management layer on **Snapdragon-powered HP PCs**, using Snapdragon NPU acceleration to support on-device AI inference where supported.

The current prototype demonstrates the architecture, live Windows workload observation, AI classification, confidence/OOD handling, safety decisions, non-destructive optimization simulation, and Qualcomm Snapdragon model-level NPU validation.

The project is therefore designed, developed, and intended for optimization and deployment on the Snapdragon-powered HP PC environment specified by the challenge.
