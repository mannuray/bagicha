package com.bagicha.app.ui.features.community

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

data class ChatMessage(
    val id: String,
    val senderId: String,
    val content: String,
    val timestamp: String,
    val isFromMe: Boolean
)

data class Conversation(
    val id: String,
    val otherUser: String,
    val lastMessage: String,
    val time: String,
    val badge: String? = null,
    val isUnread: Boolean = false,
    val imageUrl: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor() : ViewModel() {

    private val _conversations = MutableStateFlow(listOf(
        Conversation("1", "Dr. Silas Thorne", "The soil pH readings you sent indicate...", "10:42 AM", "Verified Mentor", true),
        Conversation("2", "Arjun Mehra", "Are you preparing for the early frost?", "Yesterday", "Local Orchardist", true),
        Conversation("3", "Green Earth Nursery", "Your order of heritage apple saplings is...", "TUE", "Nursery"),
        Conversation("4", "Elena Rostova", "The leaf spot pattern you described...", "OCT 12", "Botanist")
    ))
    val conversations: StateFlow<List<Conversation>> = _conversations.asStateFlow()

    private val _messages = MutableStateFlow(listOf(
        ChatMessage("1", "bot", "Greetings. I've finished reviewing the latest snapshots.", "09:12 AM", false),
        ChatMessage("2", "me", "I'm worried about the primary mango tree.", "09:15 AM", true)
    ))
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    fun sendMessage(content: String) {
        val newMsg = ChatMessage(System.currentTimeMillis().toString(), "me", content, "Just now", true)
        _messages.value = _messages.value + newMsg
    }
}
