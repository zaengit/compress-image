mod decoder; mod encoder; mod resize; mod similarity; mod smart_quality;
use wasm_bindgen::prelude::*;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResizeOptions { pub kind: String, pub value: Option<u32>, pub maintain_aspect_ratio: bool, pub prevent_enlargement: bool }

#[wasm_bindgen]
pub struct PreparedImage { rgba: Vec<u8>, width: u32, height: u32 }
#[wasm_bindgen]
impl PreparedImage {
  #[wasm_bindgen(getter)] pub fn width(&self) -> u32 { self.width }
  #[wasm_bindgen(getter)] pub fn height(&self) -> u32 { self.height }
  pub fn rgba(&self) -> Vec<u8> { self.rgba.clone() }
  pub fn encode_lossy(&self, quality: u8) -> Result<Vec<u8>, JsValue> {
    encoder::lossy_rgba(&self.rgba, self.width, self.height, quality).map_err(js_err)
  }
  pub fn encode_lossless(&self) -> Result<Vec<u8>, JsValue> {
    encoder::lossless_rgba(&self.rgba, self.width, self.height).map_err(js_err)
  }
}

#[wasm_bindgen]
pub struct CompressionOutput { bytes: Vec<u8>, width: u32, height: u32, quality: Option<u8>, similarity: Option<f64> }
#[wasm_bindgen]
impl CompressionOutput {
  pub fn bytes(&self) -> Vec<u8> { self.bytes.clone() }
  #[wasm_bindgen(getter)] pub fn width(&self) -> u32 { self.width }
  #[wasm_bindgen(getter)] pub fn height(&self) -> u32 { self.height }
  #[wasm_bindgen(getter)] pub fn quality(&self) -> Option<u8> { self.quality }
  #[wasm_bindgen(getter)] pub fn similarity(&self) -> Option<f64> { self.similarity }
}

#[wasm_bindgen(start)] pub fn start() { console_error_panic_hook::set_once(); }

#[wasm_bindgen]
pub fn prepare_image(input: &[u8], resize_json: &str) -> Result<PreparedImage, JsValue> {
  let decoded = decoder::decode(input).map_err(js_err)?;
  let opts: ResizeOptions = serde_json::from_str(resize_json).map_err(js_err)?;
  let image = resize::apply(decoded, &opts).map_err(js_err)?;
  let rgba = image.to_rgba8();
  Ok(PreparedImage { width: rgba.width(), height: rgba.height(), rgba: rgba.into_raw() })
}

#[wasm_bindgen]
pub fn compress_to_webp(input: &[u8], mode: &str, quality: Option<u8>, smart_threshold: f64, resize_json: &str) -> Result<CompressionOutput, JsValue> {
  let decoded = decoder::decode(input).map_err(js_err)?;
  let opts: ResizeOptions = serde_json::from_str(resize_json).map_err(js_err)?;
  let image = resize::apply(decoded, &opts).map_err(js_err)?;
  let (w,h) = (image.width(), image.height());
  match mode {
    "lossless" => Ok(CompressionOutput { bytes: encoder::lossless(&image).map_err(js_err)?, width:w, height:h, quality:None, similarity:Some(1.0) }),
    "custom" => { let q=quality.unwrap_or(90).clamp(1,100); Ok(CompressionOutput { bytes:encoder::lossy(&image,q).map_err(js_err)?, width:w, height:h, quality:Some(q), similarity:None }) },
    "smart" => { let r=smart_quality::compress(&image, smart_threshold).map_err(js_err)?; Ok(CompressionOutput { bytes:r.bytes,width:w,height:h,quality:Some(r.quality),similarity:Some(r.similarity) }) },
    _ => Err(JsValue::from_str("Unknown compression mode")),
  }
}

fn js_err<E: std::fmt::Display>(e:E)->JsValue { JsValue::from_str(&e.to_string()) }
