// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Pantry",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "PantryKit", targets: ["PantryKit"]),
        .executable(name: "PantryApp", targets: ["PantryApp"]),
    ],
    targets: [
        .target(name: "PantryKit"),
        .executableTarget(name: "PantryApp", dependencies: ["PantryKit"]),
        .testTarget(name: "PantryKitTests", dependencies: ["PantryKit"]),
    ]
)
