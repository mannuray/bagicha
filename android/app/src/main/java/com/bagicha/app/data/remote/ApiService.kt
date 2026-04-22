package com.bagicha.app.data.remote

import com.bagicha.app.data.remote.dto.ApiResponse
import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName
import retrofit2.http.GET
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

data class RequestOtpBody(@SerializedName("phone_number") val phoneNumber: String)
data class VerifyOtpBody(@SerializedName("phone_number") val phoneNumber: String, val otp: String)
data class UpdateProfileBody(
    val name: String?,
    val latitude: Double?,
    val longitude: Double?,
    val district: String?,
    @SerializedName("garden_types") val gardenTypes: List<String>?,
    @SerializedName("language_pref") val languagePref: String?
)

data class AuthResponse(
    @SerializedName("access_token") val accessToken: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    @SerializedName("phone_number") val phoneNumber: String,
    val name: String?,
    val latitude: Double?,
    val longitude: Double?,
    val district: String?,
    @SerializedName("garden_types") val gardenTypes: List<String> = emptyList()
)

enum class TreeTypeDto {
    FRUIT_BEARING,
    NON_FRUIT_BEARING,
    ORNAMENTAL
}

enum class LifecycleStageDto {
    SAPLING,
    JUVENILE,
    FIRST_FLOWERING,
    MATURE_BEARING
}

enum class LogTypeDto {
    PHOTO,
    NOTE,
    HARVEST,
    PEST_DIAGNOSIS,
    TREATMENT
}

data class CreateTreeBody(
    val name: String,
    val species: String,
    val variety: String?,
    val type: TreeTypeDto?,
    @SerializedName("planting_date") val plantingDate: String?,
    @SerializedName("lifecycle_stage") val lifecycleStage: LifecycleStageDto?
)

data class AddLogBody(
    val type: LogTypeDto,
    val content: String?,
    val metadata: JsonObject? = null
)

data class TreeCountDto(
    val logs: Int
)

data class TreeDto(
    val id: String,
    val name: String,
    val species: String,
    val variety: String?,
    val type: TreeTypeDto,
    @SerializedName("lifecycle_stage") val lifecycleStage: LifecycleStageDto,
    @SerializedName("health_status") val healthStatus: String,
    @SerializedName("planting_date") val plantingDate: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("_count") val count: TreeCountDto? = null
)

data class TreeLogDto(
    val id: String,
    val type: LogTypeDto,
    val content: String?,
    val metadata: JsonObject?,
    val timestamp: String
)

data class SeasonalStateDto(
    @SerializedName("species_family") val speciesFamily: String,
    @SerializedName("current_phase") val currentPhase: String,
    @SerializedName("upcoming_phase") val upcomingPhase: String,
    val confidence: String,
    @SerializedName("do_now") val doNow: List<String>,
    @SerializedName("avoid_now") val avoidNow: List<String>,
    @SerializedName("watch_for") val watchFor: List<String>,
    @SerializedName("next_checkpoint_days") val nextCheckpointDays: Int,
    val basis: String
)

interface ApiService {
    @POST("auth/request-otp")
    suspend fun requestOtp(@Body body: RequestOtpBody): ApiResponse<String>

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body body: VerifyOtpBody): ApiResponse<AuthResponse>

    @PUT("user/profile/update")
    suspend fun updateProfile(@Body body: UpdateProfileBody): ApiResponse<UserDto>

    @POST("ledger/trees")
    suspend fun createTree(@Body body: CreateTreeBody): ApiResponse<TreeDto>

    @PUT("ledger/trees/{id}")
    suspend fun updateTree(
        @Path("id") id: String,
        @Body body: CreateTreeBody
    ): ApiResponse<TreeDto>

    @GET("ledger/trees")
    suspend fun getTrees(): ApiResponse<List<TreeDto>>

    @GET("ledger/trees/{id}")
    suspend fun getTreeDetail(@Path("id") id: String): ApiResponse<TreeDto>

    @GET("ledger/trees/{id}/seasonal-state")
    suspend fun getTreeSeasonalState(@Path("id") id: String): ApiResponse<SeasonalStateDto>

    @GET("ledger/trees/{id}/timeline")
    suspend fun getTreeTimeline(
        @Path("id") id: String,
        @Query("page") page: Int = 1,
        @Query("page_size") pageSize: Int = 20
    ): ApiResponse<List<TreeLogDto>>

    @POST("ledger/trees/{id}/logs")
    suspend fun addTreeLog(
        @Path("id") id: String,
        @Body body: AddLogBody
    ): ApiResponse<TreeLogDto>
}
