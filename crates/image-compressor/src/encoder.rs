use image::DynamicImage;
use webp::Encoder;
pub fn lossless(image:&DynamicImage)->Result<Vec<u8>,String>{let rgba=image.to_rgba8();let enc=Encoder::from_rgba(&rgba,image.width(),image.height());Ok(enc.encode_lossless().to_vec())}
pub fn lossy(image:&DynamicImage,q:u8)->Result<Vec<u8>,String>{let rgba=image.to_rgba8();let enc=Encoder::from_rgba(&rgba,image.width(),image.height());Ok(enc.encode(q as f32).to_vec())}
