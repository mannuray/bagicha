package com.bagicha.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.bagicha.app.ui.features.onboarding.*
import com.bagicha.app.ui.features.dashboard.*
import com.bagicha.app.ui.features.ledger.*
import com.bagicha.app.ui.features.vision.*
import com.bagicha.app.ui.features.community.*
import com.bagicha.app.ui.features.store.*
import com.bagicha.app.ui.features.auth.*
import com.bagicha.app.ui.theme.PrimaryForest

@Composable
fun NavGraph(navController: NavHostController) {
    val ledgerViewModel: LedgerViewModel = hiltViewModel()
    val visionViewModel: VisionViewModel = hiltViewModel()
    val communityViewModel: CommunityViewModel = hiltViewModel()
    val chatViewModel: ChatViewModel = hiltViewModel()
    val storeViewModel: StoreViewModel = hiltViewModel()
    val onboardingViewModel: OnboardingViewModel = hiltViewModel()
    val dashboardViewModel: DashboardViewModel = hiltViewModel()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        // Auth & Onboarding
        composable(Screen.Splash.route) { 
            SplashScreen(onTimeout = {
                navController.navigate(Screen.Login.route) {
                    popUpTo(Screen.Splash.route) { inclusive = true }
                }
            }) 
        }
        composable(Screen.Login.route) { LoginScreen(viewModel = onboardingViewModel, onOtpSent = { navController.navigate(Screen.Otp.route) }) }
        composable(Screen.Otp.route) {
            OtpScreen(
                viewModel = onboardingViewModel,
                onVerified = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onBack = {
                    onboardingViewModel.setOtp("")
                    navController.popBackStack()
                }
            )
        }
        composable(Screen.LanguageSelection.route) {
            LanguageSelectionScreen(viewModel = onboardingViewModel, onNext = { navController.navigate(Screen.LocationSetup.route) })
        }
        composable(Screen.LocationSetup.route) {
            LocationSetupScreen(viewModel = onboardingViewModel, onNext = { navController.navigate(Screen.GardenProfile.route) })
        }
        composable(Screen.GardenProfile.route) {
            GardenProfileScreen(viewModel = onboardingViewModel, onFinish = { 
                onboardingViewModel.completeOnboarding {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            })
        }

        // Main App
        composable(Screen.Home.route) { 
            DashboardScreen(
                viewModel = dashboardViewModel,
                navController = navController,
                onOpenTask = { task ->
                    task.plantId?.let { id ->
                        navController.navigate(Screen.PlantTasks.createRoute(id))
                    }
                }
            )
        }
        composable(Screen.Ledger.route) { 
            PlantListScreen(viewModel = ledgerViewModel, navController = navController)
        }
        composable(
            route = Screen.PlantDetail.route,
            arguments = listOf(navArgument("plantId") { type = NavType.StringType })
        ) {
            PlantDetailScreen(viewModel = ledgerViewModel, navController = navController)
        }
        composable(
            route = Screen.PlantTasks.route,
            arguments = listOf(navArgument("plantId") { type = NavType.StringType })
        ) {
            PlantTasksScreen(viewModel = ledgerViewModel, navController = navController)
        }
        composable(Screen.SeasonReview.route) {
            SeasonReviewScreen(viewModel = ledgerViewModel, navController = navController)
        }
        composable(Screen.AddPlant.route) {
            AddPlantScreen(
                viewModel = ledgerViewModel,
                isEditMode = false,
                navController = navController
            )
        }
        composable(Screen.EditPlant.route) {
            AddPlantScreen(
                viewModel = ledgerViewModel,
                isEditMode = true,
                navController = navController
            )
        }
        composable(Screen.Scan.route) { 
            ScanScreen(viewModel = visionViewModel, navController = navController) 
        }
        composable(Screen.IdentifyResult.route) {
            IdentifyResultScreen(viewModel = visionViewModel, navController = navController)
        }
        composable(Screen.DiagnoseResult.route) {
            DiagnoseResultScreen(
                viewModel = visionViewModel,
                navController = navController,
                onOpenTree = {
                    visionViewModel.selectedTreeId.value?.let { id ->
                        navController.navigate(Screen.PlantDetail.createRoute(id))
                    }
                }
            )
        }

        // Community
        composable(Screen.Community.route) {
            CommunityFeedScreen(viewModel = communityViewModel, navController = navController)
        }
        composable(Screen.ChatInbox.route) {
            ChatInboxScreen(viewModel = chatViewModel, navController = navController)
        }
        composable(Screen.ChatDetail.route) { ChatDetailScreen(viewModel = chatViewModel, navController = navController) }
        composable(Screen.AiMentor.route) { AiMentorScreen(viewModel = communityViewModel, navController = navController) }

        // Profile & Settings
        composable(Screen.Profile.route) {
            ProfileScreen(navController = navController)
        }

        // Store
        composable(Screen.Marketplace.route) {
            MarketplaceScreen(viewModel = storeViewModel, navController = navController)
        }
        composable(Screen.Paywall.route) { PaywallScreen(navController = navController) }
        composable(Screen.SeedBoxBuilder.route) { SeedBoxBuilderScreen(viewModel = storeViewModel, navController = navController) }
        composable(Screen.SubscriptionStatus.route) { SubscriptionStatusScreen(viewModel = storeViewModel, navController = navController) }
    }
}
