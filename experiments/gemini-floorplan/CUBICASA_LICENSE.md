# CubiCasa / open model license (Phase 6C)

**Lab status:** research spike only — not a product feature promise.

## CubiCasa5k

| Asset | License | Implication |
| --- | --- | --- |
| [CubiCasa5k dataset](https://zenodo.org/record/2613548) | **CC BY-NC 4.0** (Non-Commercial) | OK for internal lab / research demos |
| Official pretrained weights (Drive link in [CubiCasa/CubiCasa5k](https://github.com/CubiCasa/CubiCasa5k)) | Treat as **research / non-commercial** unless CubiCasa grants otherwise | **Do not** ship in a commercial product without a commercial license |
| This repo’s `*.model.json` fixtures | Synthetic lab fixtures (not CubiCasa weights) | Safe for demos |

## floorplan-to-3d / other forks

Check each repo’s `LICENSE` before bundling weights. Prefer MIT/Apache models for product paths; CubiCasa-trained derivatives may inherit NC terms.

## Product rule

1. Lab may load **offline fixtures** or a **local** inference script for demos.  
2. Before any customer-facing “AI convert”, legal must clear model + training data licenses.  
3. Prefer re-training on owned / commercially licensed plan data, or keep classical CV (6B) for product.

## Hybrid path (G-6.13)

**Model / CV → walls & openings geometry** · **Gemini Vision → room names / notes** · **Human review → Accept**.
