//! FFXIVTools 生產巨集計算用的求解器包裝層。
//! 只把 raphael-rs 的 MacroSolver 包成一個 `solve(input)`，給 Web Worker 呼叫。

use raphael_sim::{Action, ActionMask, Condition, Settings, SimulationState};
use raphael_solver::{AtomicFlag, MacroSolver, SolverSettings};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

pub const RAPHAEL_VERSION: &str = "v0.29.3";

fn default_true() -> bool {
    true
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Input {
    max_cp: u16,
    max_durability: u16,
    max_progress: u16,
    /// 目標品質 − 初期品質
    max_quality: u16,
    base_progress: u16,
    base_quality: u16,
    job_level: u8,
    #[serde(default = "default_true")]
    allow_manipulation: bool,
    #[serde(default)]
    allow_heart_and_soul: bool,
    #[serde(default)]
    allow_quick_innovation: bool,
    #[serde(default)]
    allow_trained_eye: bool,
    #[serde(default)]
    adversarial: bool,
    #[serde(default)]
    backload_progress: bool,
    #[serde(default)]
    stellar_steady_hand_charges: u8,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Step {
    action: String,
    time: u8,
    progress: u16,
    quality: u16,
    durability: u16,
    cp: u16,
}

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct Output {
    ok: bool,
    actions: Vec<String>,
    steps: Vec<Step>,
    duration_sec: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

fn fail(error: &str, message: String) -> Output {
    Output { ok: false, error: Some(error.to_string()), message: Some(message), ..Default::default() }
}

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn version() -> String {
    RAPHAEL_VERSION.to_string()
}

#[wasm_bindgen]
pub fn solve(input: JsValue) -> Result<JsValue, JsValue> {
    let input: Input = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&format!("invalid input: {e}")))?;
    let output = run(&input);
    serde_wasm_bindgen::to_value(&output).map_err(|e| JsValue::from_str(&e.to_string()))
}

fn run(input: &Input) -> Output {
    let mut mask = ActionMask::all();
    if !input.allow_manipulation {
        mask = mask.remove(Action::Manipulation);
    }
    if !input.allow_heart_and_soul {
        mask = mask.remove(Action::HeartAndSoul);
    }
    if !input.allow_quick_innovation {
        mask = mask.remove(Action::QuickInnovation);
    }
    if !input.allow_trained_eye {
        mask = mask.remove(Action::TrainedEye);
    }
    if input.stellar_steady_hand_charges == 0 {
        mask = mask.remove(Action::StellarSteadyHand);
    }

    let settings = Settings {
        max_cp: input.max_cp,
        max_durability: input.max_durability,
        max_progress: input.max_progress,
        max_quality: input.max_quality,
        base_progress: input.base_progress,
        base_quality: input.base_quality,
        job_level: input.job_level,
        allowed_actions: mask,
        adversarial: input.adversarial,
        backload_progress: input.backload_progress,
        stellar_steady_hand_charges: input.stellar_steady_hand_charges,
    };
    let solver_settings = SolverSettings { simulator_settings: settings, allow_non_max_quality_solutions: true };

    let mut solver = MacroSolver::new(solver_settings, Box::new(|_| {}), Box::new(|_| {}), AtomicFlag::new());
    let actions = match solver.solve() {
        Ok(actions) => actions,
        Err(e) => {
            let name = format!("{e:?}");
            let code = match name.as_str() {
                "NoSolution" | "Interrupted" | "SearchQueueCapacityExceeded" => name.clone(),
                _ => "Internal".to_string(),
            };
            return fail(&code, name);
        }
    };

    // 以通常球色逐步模擬，回傳每步之後的狀態
    let mut state = SimulationState::new(&settings);
    let mut steps = Vec::with_capacity(actions.len());
    let mut duration: u32 = 0;
    for &action in &actions {
        state = match state.use_action(action, Condition::Normal, &settings) {
            Ok(s) => s,
            Err(e) => return fail("Internal", format!("simulation failed at {action:?}: {e:?}")),
        };
        let time = action.time_cost();
        duration += u32::from(time);
        steps.push(Step {
            action: format!("{action:?}"),
            time,
            progress: state.progress,
            quality: state.quality,
            durability: state.durability,
            cp: state.cp,
        });
    }

    Output {
        ok: true,
        actions: actions.iter().map(|a| format!("{a:?}")).collect(),
        steps,
        duration_sec: duration,
        ..Default::default()
    }
}
