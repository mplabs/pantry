import SwiftUI

// SPM-only entry point; the Xcode project uses App/PantryXcodeApp.swift over the same shared views.
@main
struct PantryApp: App {
    var body: some Scene { WindowGroup { RootView() } }
}
