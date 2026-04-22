package com.bagicha.app.ui.features.community

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

data class ForumPost(
    val id: String,
    val author: String,
    val badge: String,
    val content: String,
    val upvotes: Int,
    val commentCount: Int,
    val district: String,
    val time: String
)

data class AiMessage(
    val id: String,
    val content: String,
    val isFromUser: Boolean,
    val citations: List<String> = emptyList()
)

@HiltViewModel
class CommunityViewModel @Inject constructor() : ViewModel() {

    private val _posts = MutableStateFlow(listOf(
        ForumPost("1", "Ramesh Kumar", "Master Orchardist", "My Langra Mango tree has some white fuzzy spots. Is it mealybugs?", 12, 4, "Patna", "2h ago"),
        ForumPost("2", "Dr. Sharma", "Verified Expert", "A quick guide on post-monsoon pruning for Litchi trees.", 45, 8, "Bihar", "5h ago"),
        ForumPost("3", "Sunita Rao", "Seedling", "Check out my first harvest of organic cherry tomatoes!", 30, 15, "Patna", "1d ago")
    ))
    val posts: StateFlow<List<ForumPost>> = _posts.asStateFlow()

    private val _aiMessages = MutableStateFlow(listOf(
        AiMessage("1", "Hello! I am your Bagicha AI Mentor. How can I help your garden today?", false)
    ))
    val aiMessages: StateFlow<List<AiMessage>> = _aiMessages.asStateFlow()

    fun askAi(question: String) {
        val userMsg = AiMessage(System.currentTimeMillis().toString(), question, true)
        _aiMessages.value = _aiMessages.value + userMsg
        
        // Mock AI Response
        val botMsg = AiMessage(
            (System.currentTimeMillis() + 1).toString(),
            "Based on expert advice in the Patna district, those white spots are likely Mealybugs. You should apply Neem Oil solution this evening.",
            false,
            listOf("Pruning Basics by Dr. Sharma", "Mealybug Alert - June 2026")
        )
        _aiMessages.value = _aiMessages.value + botMsg
    }
}
