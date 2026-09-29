// Encode the existing Blender assembly renders as a silent, local product film.
// First create artifacts/film-frames/000.png...059.png using sharp (see VELORNE-ASSETS.md).
import Foundation
import AVFoundation
import ImageIO

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let output = root.appendingPathComponent("public/media/velorne/assembly-film.mp4")
if FileManager.default.fileExists(atPath: output.path) { try FileManager.default.removeItem(at: output) }
let frames: [CGImage] = try (0..<60).map { index in
    let url = root.appendingPathComponent(String(format: "artifacts/film-frames/%03d.png", index))
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil), let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "Missing render frame", code: index)
    }
    return image
}
let size = 800
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: size, AVVideoHeightKey: size,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1800000, AVVideoMaxKeyFrameIntervalKey: 24]
])
input.expectsMediaDataInRealTime = false
let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: size, kCVPixelBufferHeightKey as String: size,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
])
writer.add(input)
guard writer.startWriting() else { throw writer.error! }
writer.startSession(atSourceTime: .zero)
for index in 0..<192 {
    while !input.isReadyForMoreMediaData {
        if writer.status == .failed { throw writer.error! }
        Thread.sleep(forTimeInterval: 0.002)
    }
    var pixel: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, adapter.pixelBufferPool!, &pixel) == kCVReturnSuccess, let pixel = pixel else { fatalError("Pixel buffer unavailable") }
    CVPixelBufferLockBaseAddress(pixel, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: size, height: size, bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    let position = min(59.0, max(0.0, (Double(index) / 24.0 - 0.7) / 6.6 * 59.0))
    let first = Int(position), second = min(59, first + 1)
    let rect = CGRect(x: 0, y: 0, width: size, height: size)
    context.draw(frames[first], in: rect)
    context.setAlpha(position - Double(first))
    context.draw(frames[second], in: rect)
    CVPixelBufferUnlockBaseAddress(pixel, [])
    guard adapter.append(pixel, withPresentationTime: CMTime(value: Int64(index), timescale: 24)) else { throw writer.error! }
}
input.markAsFinished()
let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting { semaphore.signal() }
semaphore.wait()
guard writer.status == .completed else { throw writer.error! }
print("Encoded 8-second silent assembly film: \(output.path)")
