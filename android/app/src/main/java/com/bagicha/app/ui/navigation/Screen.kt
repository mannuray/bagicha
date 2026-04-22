package com.bagicha.app.ui.navigation

sealed class Screen(val route: String) {
    // Auth & Onboarding
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Otp : Screen("otp")
    object LanguageSelection : Screen("language_selection")
    object LocationSetup : Screen("location_setup")
    object GardenProfile : Screen("garden_profile")
    
    // Main App
    object Home : Screen("home")
    object Ledger : Screen("ledger")
    object TreeDetail : Screen("tree_detail")
    object AddTree : Screen("add_tree")
    object EditTree : Screen("edit_tree")
    object Scan : Screen("scan")
    object IdentifyResult : Screen("identify_result")
    object DiagnoseResult : Screen("diagnose_result")
    object Community : Screen("community")
    object ChatInbox : Screen("chat_inbox")
    object ChatDetail : Screen("chat_detail")
    object AiMentor : Screen("ai_mentor")
    object Marketplace : Screen("marketplace")
    object Paywall : Screen("paywall")
    object SeedBoxBuilder : Screen("seed_box_builder")
    object SubscriptionStatus : Screen("subscription_status")
    object Profile : Screen("profile")
}
