use image::DynamicImage;
use crate::{encoder, similarity};

pub struct SmartResult { pub bytes: Vec<u8>, pub quality: u8, pub similarity: f64 }

// Sorted low -> high so the search finds the lowest quality that still meets the threshold.
const QUALITIES: [u8; 7] = [80, 82, 85, 87, 90, 92, 95];

fn evaluate(original: &DynamicImage, rgba: &[u8], quality: u8) -> Result<SmartResult, String> {
    let bytes = encoder::lossy_rgba(rgba, original.width(), original.height(), quality)?;
    let decoded = image::load_from_memory_with_format(&bytes, image::ImageFormat::WebP)
        .map_err(|e| e.to_string())?;
    let score = similarity::ssim(original, &decoded)?;
    Ok(SmartResult { bytes, quality, similarity: score })
}

pub fn compress(original: &DynamicImage, threshold: f64) -> Result<SmartResult, String> {
    let rgba = original.to_rgba8();

    // Fast path: the smallest candidate already preserves enough similarity.
    let lowest = evaluate(original, rgba.as_raw(), QUALITIES[0])?;
    if lowest.similarity >= threshold {
        return Ok(lowest);
    }

    // Establish a passing upper bound. If Q95 still fails, it is the best fallback.
    let highest_index = QUALITIES.len() - 1;
    let highest = evaluate(original, rgba.as_raw(), QUALITIES[highest_index])?;
    if highest.similarity < threshold {
        return Ok(highest);
    }

    // Invariant: `low` fails and `high` passes. Find the first passing quality.
    let mut low = 0usize;
    let mut high = highest_index;
    let mut best = highest;

    while high - low > 1 {
        let mid = low + (high - low) / 2;
        let candidate = evaluate(original, rgba.as_raw(), QUALITIES[mid])?;
        if candidate.similarity >= threshold {
            high = mid;
            best = candidate;
        } else {
            low = mid;
        }
    }

    Ok(best)
}
