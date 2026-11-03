import AppKit
import PDFKit

let arguments = CommandLine.arguments
guard arguments.count >= 3, let document = PDFDocument(url: URL(fileURLWithPath: arguments[1])) else {
  FileHandle.standardError.write("Usage: swift pages.swift <file.pdf> <output folder> [scale]\n".data(using: .utf8)!)
  exit(1)
}
let scale = arguments.count > 3 ? CGFloat(Double(arguments[3]) ?? 1.5) : 1.5
for index in 0..<document.pageCount {
  guard let page = document.page(at: index) else { continue }
  let box = page.bounds(for: .mediaBox)
  let image = page.thumbnail(of: NSSize(width: box.width * scale, height: box.height * scale), for: .mediaBox)
  guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) else { continue }
  try png.write(to: URL(fileURLWithPath: arguments[2]).appendingPathComponent("page-\(index + 1).png"))
}
print(document.pageCount)
