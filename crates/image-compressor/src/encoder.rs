use image::DynamicImage;
use webp::Encoder;

pub fn lossless(image: &DynamicImage) -> Result<Vec<u8>, String> {
    let rgba = image.to_rgba8();
    lossless_rgba(rgba.as_raw(), image.width(), image.height())
}

pub fn lossy(image: &DynamicImage, q: u8) -> Result<Vec<u8>, String> {
    let rgba = image.to_rgba8();
    lossy_rgba(rgba.as_raw(), image.width(), image.height(), q)
}

pub fn lossless_rgba(rgba: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
    validate_rgba(rgba, width, height)?;
    let enc = Encoder::from_rgba(rgba, width, height);
    Ok(enc.encode_lossless().to_vec())
}

pub fn lossy_rgba(rgba: &[u8], width: u32, height: u32, q: u8) -> Result<Vec<u8>, String> {
    validate_rgba(rgba, width, height)?;
    let enc = Encoder::from_rgba(rgba, width, height);
    Ok(enc.encode(q.clamp(1, 100) as f32).to_vec())
}

fn validate_rgba(rgba: &[u8], width: u32, height: u32) -> Result<(), String> {
    let expected = width as usize * height as usize * 4;
    if rgba.len() != expected {
        return Err(format!("Invalid RGBA length: expected {expected}, got {}", rgba.len()));
    }
    Ok(())
}
