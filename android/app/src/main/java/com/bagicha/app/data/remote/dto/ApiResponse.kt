package com.bagicha.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?,
    val pagination: Pagination?,
    @SerializedName("request_id") val requestId: String,
    val timestamp: String
)

data class Pagination(
    val page: Int,
    @SerializedName("page_size") val pageSize: Int,
    @SerializedName("total_items") val totalItems: Int,
    @SerializedName("total_pages") val totalPages: Int,
    @SerializedName("has_next") val hasNext: Boolean,
    @SerializedName("has_previous") val hasPrevious: Boolean
)

data class ApiError(
    val code: String,
    val message: String,
    @SerializedName("validation_errors") val validationErrors: List<ValidationError>?
)

data class ValidationError(
    val field: String,
    val message: String
)
