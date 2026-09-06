use image::{DynamicImage, RgbaImage};
use crate::{encoder, similarity};

pub struct SmartResult { pub bytes: Vec<u8>, pub quality: u8, pub similarity: f64 }

pub fn compress(original: &DynamicImage, threshold: f64) -> Result<SmartResult, String> {
    let rgba = original.to_rgba8();
    let reference = DynamicImage::ImageRgba8(RgbaImage::from_raw(
        original.width(),
        original.height(),
        rgba.as_raw().clone(),
    ).ok_or_else(|| "Failed to build Smart reference image".to_string())?);

    let qualities = [95u8, 92, 90, 87, 85, 82, 80];
    let mut fallback: Option<SmartResult> = None;
    let mut selected: Option<SmartResult> = None;

    for q in qualities {
        let bytes = encoder::lossy_rgba(rgba.as_raw(), original.width(), original.height(), q)?;
        let decoded = image::load_from_memory_with_format(&bytes, image::ImageFormat::WebP)
            .map_err(|e| e.to_string())?;
        let score = similarity::ssim(&reference, &decoded)?;
        let candidate = SmartResult { bytes, quality: q, similarity: score };

        if fallback.is_none() {
            fallback = Some(SmartResult {
                bytes: candidate.bytes.clone(),
                quality: candidate.quality,
                similarity: candidate.similarity,
            });
        }

        if score >= threshold && selected.as_ref().map_or(true, |best| candidate.bytes.len() < best.bytes.len()) {
            selected = Some(candidate);
        }
    }

    selected.or(fallback).ok_or_else(|| "No Smart candidate produced".to_string())
}
