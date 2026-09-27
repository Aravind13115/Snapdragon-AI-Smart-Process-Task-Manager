"""Generate a professional PDF describing the Snapdragon AI model."""

from fpdf import FPDF


class ModelPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 5, "Snapdragon AI Smart Process & Task Manager", align="R")
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(180, 180, 180)
        self.cell(0, 8, f"Page {self.page_no()} / {{nb}}  |  Independent Competition Prototype", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(20, 60, 120)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(20, 60, 120)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def subsection_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(40, 80, 160)
        self.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")

    def body_text(self, text):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(50, 50, 50)
        self.cell(5)
        self.multi_cell(0, 5, f"  {text}")
        self.ln(1)

    def code_block(self, text):
        self.set_font("Courier", "", 8)
        self.set_text_color(30, 30, 30)
        self.set_fill_color(240, 244, 250)
        self.multi_cell(0, 4.5, text, fill=True)
        self.ln(3)

    def add_table(self, headers, rows, col_widths=None):
        if col_widths is None:
            col_widths = [self.w / len(headers)] * len(headers)
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(20, 60, 120)
        self.set_text_color(255, 255, 255)
        for h, w in zip(headers, col_widths):
            self.cell(w, 6, h, border=1, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 8)
        self.set_text_color(50, 50, 50)
        fill = False
        for row in rows:
            if fill:
                self.set_fill_color(240, 244, 250)
            for cell, w in zip(row, col_widths):
                self.cell(w, 5.5, str(cell), border=1, fill=fill, align="C")
            self.ln()
            fill = not fill
        self.ln(4)


def build_pdf():
    pdf = ModelPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # ── Title ──
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(15, 40, 90)
    pdf.cell(0, 14, "Process Priority Classifier", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(60, 100, 180)
    pdf.cell(0, 8, "11-Feature ONNX Neural Network", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, "Snapdragon AI Smart Process & Task Manager", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 4, "Model Architecture & Validation Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # ── 1. Overview ──
    pdf.section_title("1. Model Overview")
    pdf.body_text(
        "The Process Priority Classifier is a lightweight neural network designed to classify Windows "
        "processes into four workload categories based on 11 observable system features. The model "
        "runs entirely on-device via ONNX Runtime, with a target execution path on the Qualcomm "
        "Snapdragon Hexagon NPU."
    )
    pdf.body_text(
        "Model size is 1.9 KB, making it suitable for edge deployment on resource-constrained "
        "Windows on Arm devices. Training uses pure NumPy (no scikit-learn or PyTorch dependencies), "
        "and the exported ONNX graph contains only four operators: Gemm, Relu, Softmax, and ArgMax."
    )

    # ── 2. Architecture ──
    pdf.section_title("2. Network Architecture")
    pdf.body_text("The model is a 3-layer MLP with the following structure:")
    pdf.ln(2)
    pdf.add_table(
        ["Layer", "Type", "Input", "Output", "Activation"],
        [
            ["1", "Gemm + ReLU", "11", "16", "ReLU"],
            ["2", "Gemm + ReLU", "16", "8", "ReLU"],
            ["3", "Gemm + Softmax", "8", "4", "Softmax"],
            ["4", "ArgMax", "4", "1", "Index"],
        ],
        col_widths=[20, 40, 30, 30, 35],
    )
    pdf.body_text(
        "Total parameters: 11x16 + 16 + 16x8 + 8 + 8x4 + 4 = 176 + 16 + 128 + 8 + 32 + 4 = 364. "
        "ONNX opset 12, IR version 10, model size 1.9 KB."
    )

    # ── 3. Features ──
    pdf.section_title("3. Input Features (11 signals)")
    pdf.body_text(
        "Each process is represented by an 11-dimensional feature vector extracted from live "
        "system telemetry. Features are normalized using pre-computed mean and scale values "
        "baked into the model metadata."
    )
    pdf.ln(2)
    pdf.add_table(
        ["#", "Feature", "Description"],
        [
            ["1", "cpu_norm", "Normalized CPU usage (% of total capacity)"],
            ["2", "cpu_trend", "Short-term CPU trend (rising / falling)"],
            ["3", "mem_norm", "Normalized memory usage"],
            ["4", "io_rate", "Disk I/O rate level"],
            ["5", "net_level", "Network activity level"],
            ["6", "is_foreground", "Whether the process owns the foreground window"],
            ["7", "on_battery", "Whether the system is on battery power"],
            ["8", "user_activity", "Recent user input activity indicator"],
            ["9", "arch_native", "Whether the binary runs natively (not emulated)"],
            ["10", "is_emulated", "Whether the process is running under x86/x64 emulation"],
            ["11", "hist_cpu", "Historical CPU average for this process"],
        ],
        col_widths=[12, 35, 110],
    )

    # ── 4. Output Classes ──
    pdf.section_title("4. Output Classes")
    pdf.add_table(
        ["Class", "Label", "Typical Meaning"],
        [
            ["0", "PROTECTED", "System-critical or foreground application"],
            ["1", "USER_IMPORTANT", "Known important background workload"],
            ["2", "FLEXIBLE", "Safe to reduce background activity"],
            ["3", "DEFERRABLE", "Can be deferred when appropriate"],
        ],
        col_widths=[20, 45, 92],
    )

    # ── 5. Training ──
    pdf.section_title("5. Training Details")
    pdf.bullet("Framework: Pure NumPy implementation (no external ML frameworks)")
    pdf.bullet("Optimizer: Adam (learning rate 0.001)")
    pdf.bullet("Epochs: 250 with batch size 64")
    pdf.bullet("Loss: Cross-entropy with temperature scaling")
    pdf.bullet("Dataset: 4,000 synthetic samples (1,000 per class)")
    pdf.bullet("Synthetic test accuracy: 87.38% (explicitly NOT real-world accuracy)")
    pdf.bullet("No label leakage in final training pipeline")
    pdf.bullet("Temperature calibration: T = 2.0 (NLL grid search)")
    pdf.bullet("OOD centroids computed per-class in standardized feature space")

    # ── 6. Calibration & OOD ──
    pdf.section_title("6. Confidence Calibration & OOD Detection")
    pdf.body_text(
        "Raw softmax probabilities are never trusted alone. The final confidence score is "
        "computed as a product of calibrated model confidence and familiarity:"
    )
    pdf.ln(2)
    pdf.code_block("final_confidence = calibrated_confidence x familiarity")
    pdf.ln(2)
    pdf.body_text(
        "Familiarity is computed using a radial basis function (RBF) kernel measuring distance "
        "to the nearest per-class centroid in standardized feature space. Unfamiliar workloads "
        "(low familiarity) receive reduced confidence, causing the system to become more "
        "conservative."
    )
    pdf.ln(2)
    pdf.add_table(
        ["Parameter", "Value", "Description"],
        [
            ["Temperature (T)", "2.0", "Softmax temperature scaling"],
            ["OOD threshold", "0.35", "Minimum familiarity for known classification"],
            ["Confidence threshold", "0.85", "Minimum for optimization candidate"],
            ["Extreme z-score", "|z| > 5", "Halves familiarity score"],
        ],
        col_widths=[50, 35, 72],
    )

    # ── 7. Safety Layer ──
    pdf.section_title("7. Safety Layer (Post-Model)")
    pdf.body_text(
        "The AI model only predicts. A separate deterministic safety engine makes the final "
        "decision. The safety layer operates on a default-deny posture:"
    )
    pdf.ln(2)
    pdf.bullet("Kernel pseudo-processes (PID 0, 4): always PROTECT, never sent to model")
    pdf.bullet("Allowlisted system processes (lsass, csrss, services, etc.): always PROTECT")
    pdf.bullet("Foreground applications: always PROTECT (no action on what the user sees)")
    pdf.bullet("Out-of-distribution workloads: always REVIEW (never act on the unfamiliar)")
    pdf.bullet("Low confidence (< 0.85): always REVIEW")
    pdf.bullet("High confidence + high familiarity + safe class: OPTIMIZATION CANDIDATE")
    pdf.ln(2)
    pdf.body_text(
        "No process-control operations exist anywhere in the codebase. The system is "
        "recommendation-only and non-destructive."
    )

    # ── 8. NPU Validation ──
    pdf.section_title("8. Qualcomm Snapdragon NPU Validation")
    pdf.body_text(
        "The ONNX model was validated through Qualcomm AI Hub on a Snapdragon X Elite CRD "
        "(sc8380xp, Windows 11, Hexagon v73). This is model-level validation on reference "
        "hardware, not a claim about local execution."
    )
    pdf.ln(2)
    pdf.add_table(
        ["Stage", "Job ID", "Status", "Key Result"],
        [
            ["Compile", "jp0m9yd0g", "SUCCESS", "ONNX model compiled to DLC"],
            ["Link", "j568m6rng", "SUCCESS", "Target DLC: 13.1 KB"],
            ["Profile", "jpxlrj1lp", "SUCCESS", "10/10 nodes on NPU"],
            ["Inference", "j5wlrew3p", "SUCCESS", "4/4 argmax agreement"],
        ],
        col_widths=[28, 35, 28, 66],
    )
    pdf.ln(2)
    pdf.body_text(
        "Maximum probability difference between CPU and NPU outputs: 0.0015. "
        "Early compilation failures (int64 flag, batch shape) are retained in job history "
        "as documented debugging evidence."
    )

    # ── 9. Performance ──
    pdf.section_title("9. Performance Characteristics (Local Intel CPU)")
    pdf.add_table(
        ["Metric", "Value"],
        [
            ["Model size", "1.9 KB"],
            ["ONNX operators", "4 (Gemm, Relu, Softmax, ArgMax)"],
            ["ONNX nodes", "10"],
            ["Opset / IR version", "12 / 10"],
            ["Single-row CPU inference", "0.024 ms"],
            ["Batch-64 CPU inference", "0.051 ms"],
            ["Model load time", "13.06 ms"],
            ["Monitoring overhead", "~1% steady CPU"],
            ["Application RAM usage", "~70 MB"],
            ["Total parameters", "364"],
        ],
        col_widths=[80, 77],
    )

    # ── 10. Deployment ──
    pdf.section_title("10. Deployment Architecture")
    pdf.body_text(
        "The model is deployed as part of a local-only HTTP server application. The architecture "
        "separates telemetry collection, feature engineering, ONNX inference, safety decisions, "
        "and recommendation generation into distinct modules."
    )
    pdf.ln(2)
    pdf.body_text("Pipeline flow:")
    pdf.ln(1)
    pdf.code_block(
        "psutil telemetry  ->  11-feature vector  ->  ONNX inference  ->  "
        "softmax + ArgMax\n"
        "                                                             |\n"
        "                                          calibrated confidence x familiarity\n"
        "                                                             |\n"
        "                                              deterministic safety layer\n"
        "                                                             |\n"
        "                                              read-only recommendation"
    )

    # ── 11. Limitations ──
    pdf.section_title("11. Honest Limitations")
    pdf.bullet("Model trained on synthetic data only (87.38% synthetic fit, not real-world accuracy)")
    pdf.bullet("Full HP Snapdragon PC end-to-end validation requires physical hardware")
    pdf.bullet("No battery savings or CPU savings measurements have been performed")
    pdf.bullet("GPU telemetry not available via psutil on all Windows systems")
    pdf.bullet("The local development machine is Intel-based; CPU FALLBACK is the honest status")
    pdf.bullet("The 11-feature model is intentionally simple; real-world accuracy is unmeasured")

    # ── 12. File Inventory ──
    pdf.section_title("12. Model Artifacts")
    pdf.add_table(
        ["File", "Description"],
        [
            ["models/process_classifier.onnx", "The 1.9 KB ONNX model (opset 12, IR v10)"],
            ["models/model_metadata.json", "Normalization stats, OOD centroids, calibration"],
            ["ai/train_model.py", "Pure NumPy training + ONNX graph export script"],
            ["ai/dataset.py", "Synthetic dataset generator (4 classes x 1000 samples)"],
            ["ai/features.py", "11-feature engineering module"],
            ["ai/ood.py", "Out-of-distribution detection (RBF centroid distance)"],
            ["ai/safety.py", "Deterministic safety layer (4 states)"],
            ["ai/recommend.py", "Recommendation mapping with confidence threshold"],
            ["inference/onnx_backend.py", "ONNX Runtime inference (CPUExecutionProvider)"],
            ["inference/backend.py", "Backend selection (NPU vs CPU fallback)"],
        ],
        col_widths=[75, 82],
    )

    # ── Footer note ──
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.multi_cell(
        0, 4,
        "Independent competition prototype. Not affiliated with or endorsed by Qualcomm, "
        "Snapdragon, HP, or Microsoft. All validation evidence is from Qualcomm AI Hub "
        "reference hardware (Snapdragon X Elite CRD), not local execution.",
    )

    return pdf


if __name__ == "__main__":
    pdf = build_pdf()
    out = r"C:\Users\ariko\OneDrive\Desktop\snapdragon\MODEL_ARCHITECTURE.pdf"
    pdf.output(out)
    print(f"PDF written to {out}")
    print(f"Pages: {pdf.pages_count}")
