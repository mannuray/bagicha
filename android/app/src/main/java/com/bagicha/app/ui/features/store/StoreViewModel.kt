package com.bagicha.app.ui.features.store

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

data class Product(
    val id: String,
    val name: String,
    val category: String,
    val price: Int,
    val description: String,
    val isSapling: Boolean = false
)

data class Subscription(
    val id: String,
    val name: String,
    val status: String,
    val nextDelivery: String
)

@HiltViewModel
class StoreViewModel @Inject constructor() : ViewModel() {

    private val _products = MutableStateFlow(listOf(
        Product("1", "Langra Mango Sapling", "ORCHARD", 499, "High-yield variety from Bihar.", true),
        Product("2", "Citrus Fertilizer", "CARE", 250, "Organic boosters for fruit trees."),
        Product("3", "Pruning Shears", "TOOLS", 1299, "Professional grade stainless steel."),
        Product("4", "Tomato Seeds (Hybrid)", "SEEDS", 49, "Perfect for summer sowing.")
    ))
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _activeSubscriptions = MutableStateFlow(listOf(
        Subscription("1", "Summer Vegetable Kit", "Active", "Feb 20th"),
        Subscription("2", "Flowering Kit", "Paused", "June 15th")
    ))
    val activeSubscriptions: StateFlow<List<Subscription>> = _activeSubscriptions.asStateFlow()

    private val _boxItems = MutableStateFlow<List<Product>>(emptyList())
    val boxItems: StateFlow<List<Product>> = _boxItems.asStateFlow()

    fun addToBox(product: Product) {
        if (_boxItems.value.size < 8) {
            _boxItems.value = _boxItems.value + product
        }
    }

    fun removeFromBox(productId: String) {
        _boxItems.value = _boxItems.value.filter { it.id != productId }
    }
}
