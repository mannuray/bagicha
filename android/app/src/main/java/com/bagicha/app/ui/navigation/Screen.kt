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
    object PlantDetail : Screen("plant_detail/{plantId}") {
        fun createRoute(plantId: String) = "plant_detail/$plantId"
    }
    object PlantTasks : Screen("plant_tasks/{plantId}") {
        fun createRoute(plantId: String) = "plant_tasks/$plantId"
    }
    object SeasonReview : Screen("season_review")
    object AddPlant : Screen("add_plant")
    object EditPlant : Screen("edit_plant")
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
