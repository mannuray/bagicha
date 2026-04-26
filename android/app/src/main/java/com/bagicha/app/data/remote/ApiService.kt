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

enum class RecordKindDto {
    TREE,
    FLOWER,
    CROP
}

enum class LifecycleStageDto {
    SAPLING,
    JUVENILE,
    FIRST_FLOWERING,
    FIRST_HARVEST,
    MATURE_BEARING
}

enum class PlantingDatePrecisionDto {
    EXACT_DATE,
    MONTH_YEAR,
    YEAR,
    UNKNOWN
}

enum class GrowthHabitDto {
    PERENNIAL,
    ANNUAL,
    BIENNIAL,
    SEASONAL,
    UNKNOWN
}

enum class RecordPatternDto {
    LONG_LIVED,
    RECURRING_SEASONAL,
    ONE_OFF_SEASON
}

enum class LogTypeDto {
    PLANTING,
    PHOTO,
    NOTE,
    WATERING,
    WATERING_STRESS,
    PRUNING,
    FEEDING,
    FLOWERING,
    FLOWER_DROP,
    FRUIT_SET,
    FRUIT_DROP,
    HARVEST,
    PEST_DIAGNOSIS,
    TREATMENT,
    DIAGNOSIS,
    WEATHER_DAMAGE
}

data class CreateTreeBody(
    val name: String,
    val species: String,
    val variety: String?,
    @SerializedName("record_kind") val recordKind: RecordKindDto?,
    val type: TreeTypeDto?,
    @SerializedName("growth_habit") val growthHabit: GrowthHabitDto?,
    @SerializedName("record_pattern") val recordPattern: RecordPatternDto?,
    @SerializedName("planting_date") val plantingDate: String?,
    @SerializedName("planting_date_precision") val plantingDatePrecision: PlantingDatePrecisionDto?,
    @SerializedName("lifecycle_stage") val lifecycleStage: LifecycleStageDto?
)

data class AddLogBody(
    val type: LogTypeDto,
    val content: String?,
    val metadata: JsonObject? = null,
    @SerializedName("event_at") val eventAt: String? = null
)

data class TreeCountDto(
    val logs: Int
)

data class TreeDto(
    val id: String,
    val name: String,
    @SerializedName("species_family") val speciesFamily: String? = null,
    val species: String,
    val variety: String?,
    @SerializedName("record_kind") val recordKind: RecordKindDto,
    val type: TreeTypeDto,
    @SerializedName("growth_habit") val growthHabit: GrowthHabitDto,
    @SerializedName("record_pattern") val recordPattern: RecordPatternDto,
    @SerializedName("lifecycle_stage") val lifecycleStage: LifecycleStageDto,
    @SerializedName("health_status") val healthStatus: String,
    @SerializedName("planting_date") val plantingDate: String?,
    @SerializedName("planting_date_precision") val plantingDatePrecision: PlantingDatePrecisionDto? = null,
    @SerializedName("planting_date_input") val plantingDateInput: String? = null,
    @SerializedName("first_flowering_at") val firstFloweringAt: String? = null,
    @SerializedName("first_fruit_set_at") val firstFruitSetAt: String? = null,
    @SerializedName("first_harvest_at") val firstHarvestAt: String? = null,
    @SerializedName("latest_harvest_at") val latestHarvestAt: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("_count") val count: TreeCountDto? = null
)

data class TreeLogDto(
    val id: String,
    val type: LogTypeDto,
    val content: String?,
    val metadata: JsonObject?,
    val timestamp: String,
    @SerializedName("recorded_at") val recordedAt: String? = null
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

data class MitigationPlanDto(
    @SerializedName("cycle_year") val cycleYear: Int? = null,
    val summary: String,
    @SerializedName("likely_issues") val likelyIssues: List<String> = emptyList(),
    @SerializedName("what_to_change") val whatToChange: List<String> = emptyList(),
    @SerializedName("watch_early") val watchEarly: List<String> = emptyList(),
    @SerializedName("priority_actions") val priorityActions: List<String> = emptyList(),
    @SerializedName("completed_tasks") val completedTasks: Int = 0,
    @SerializedName("skipped_tasks") val skippedTasks: Int = 0,
    @SerializedName("pending_tasks") val pendingTasks: Int = 0
)

data class TreeCycleEventDto(
    val id: String,
    val type: LogTypeDto,
    val content: String?,
    val timestamp: String
)

data class TreeCycleDto(
    val id: String,
    @SerializedName("cycle_year") val cycleYear: Int,
    @SerializedName("observed_flowering_at") val observedFloweringAt: String? = null,
    @SerializedName("observed_fruit_set_at") val observedFruitSetAt: String? = null,
    @SerializedName("harvest_started_at") val harvestStartedAt: String? = null,
    @SerializedName("harvest_completed_at") val harvestCompletedAt: String? = null,
    @SerializedName("yield_quantity") val yieldQuantity: Double? = null,
    @SerializedName("yield_unit") val yieldUnit: String? = null,
    @SerializedName("yield_quality") val yieldQuality: String? = null,
    @SerializedName("flower_drop_level") val flowerDropLevel: String? = null,
    @SerializedName("fruit_drop_level") val fruitDropLevel: String? = null,
    @SerializedName("stress_score") val stressScore: Int? = null,
    @SerializedName("pest_pressure_score") val pestPressureScore: Int? = null,
    @SerializedName("treatment_count") val treatmentCount: Int? = null,
    @SerializedName("cycle_summary") val cycleSummary: String? = null,
    @SerializedName("recommended_next_cycle_actions") val recommendedNextCycleActions: List<String>? = null,
    @SerializedName("recent_events") val recentEvents: List<TreeCycleEventDto> = emptyList()
)

enum class TaskTypeDto {
    WATER,
    INSPECT,
    OBSERVE,
    PRUNE,
    FEED,
    HARVEST,
    TREAT
}

enum class TaskStatusDto {
    PENDING,
    COMPLETED,
    SKIPPED
}

enum class TaskPriorityDto {
    LOW,
    MEDIUM,
    HIGH
}

enum class TaskSourceDto {
    SYSTEM,
    SEASONAL_PACK,
    PERSONALIZED_OVERLAY,
    MANUAL
}

data class TreeTaskDto(
    val id: String,
    val type: TaskTypeDto,
    val title: String,
    val category: String? = null,
    val priority: TaskPriorityDto,
    val status: TaskStatusDto,
    val source: TaskSourceDto,
    val reason: String? = null,
    @SerializedName("source_summary") val sourceSummary: String? = null,
    @SerializedName("due_date") val dueDate: String,
    @SerializedName("completed_at") val completedAt: String? = null,
    @SerializedName("tree_id") val treeId: String? = null,
    @SerializedName("tree_name") val treeName: String? = null,
    @SerializedName("record_kind") val recordKind: RecordKindDto? = null,
    @SerializedName("tree_cycle_id") val treeCycleId: String? = null,
    @SerializedName("cycle_year") val cycleYear: Int? = null
)

data class MaterializeTasksResponse(
    @SerializedName("created_count") val createdCount: Int,
    @SerializedName("created_tasks") val createdTasks: List<TreeTaskDto> = emptyList()
)

data class UpdateTaskStatusBody(
    val status: TaskStatusDto
)

data class PlantIdentityDto(
    val id: String,
    @SerializedName("display_name") val displayName: String,
    @SerializedName("species_family") val speciesFamily: String,
    val species: String,
    val variety: String?,
    @SerializedName("plant_type") val plantType: String,
    @SerializedName("matched_alias") val matchedAlias: String? = null
)

data class PlantSearchResponse(
    val items: List<PlantIdentityDto>
)

data class ResolvePlantBody(
    val query: String,
    @SerializedName("region_cluster") val regionCluster: String? = null,
    val language: String? = null
)

data class ResolvePlantResponse(
    val match: PlantIdentityDto?,
    val confidence: String,
    @SerializedName("matched_alias") val matchedAlias: String?,
    val alternatives: List<PlantIdentityDto> = emptyList()
)

data class VisionRequestBody(
    @SerializedName("image_base64") val imageBase64: String,
    @SerializedName("tree_id") val treeId: String? = null,
    val note: String? = null,
    @SerializedName("event_at") val eventAt: String? = null
)

data class IdentifyPlantDto(
    @SerializedName("common_name") val commonName: String? = null,
    @SerializedName("scientific_name") val scientificName: String? = null,
    val description: String? = null,
    @SerializedName("care_summary") val careSummary: String? = null
)

data class DiagnosePayloadDto(
    @SerializedName("primary_issue") val primaryIssue: String? = null,
    @SerializedName("secondary_issues") val secondaryIssues: List<String> = emptyList(),
    val symptoms: List<String> = emptyList(),
    val confidence: String? = null,
    val severity: String? = null,
    @SerializedName("affected_part") val affectedPart: String? = null,
    @SerializedName("reasoning_summary") val reasoningSummary: String? = null,
    @SerializedName("recommended_actions") val recommendedActions: List<String> = emptyList(),
    @SerializedName("needs_follow_up") val needsFollowUp: Boolean = false,
    @SerializedName("follow_up_days") val followUpDays: Int? = null
)

data class DiagnosePlantResponseDto(
    val diagnosis: DiagnosePayloadDto,
    val persisted: Boolean = false,
    @SerializedName("session_id") val sessionId: String? = null,
    @SerializedName("outcome_id") val outcomeId: String? = null,
    @SerializedName("log_ids") val logIds: List<String> = emptyList(),
    @SerializedName("task_id") val taskId: String? = null
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

    @GET("ledger/trees/{id}/cycles")
    suspend fun getTreeCycles(@Path("id") id: String): ApiResponse<List<TreeCycleDto>>

    @GET("ledger/trees/{id}/tasks")
    suspend fun getTreeTasks(@Path("id") id: String): ApiResponse<List<TreeTaskDto>>

    @GET("ledger/tasks")
    suspend fun getUserTasks(): ApiResponse<List<TreeTaskDto>>

    @GET("ledger/trees/{id}/mitigation-plan")
    suspend fun getMitigationPlan(@Path("id") id: String): ApiResponse<MitigationPlanDto>

    @PUT("ledger/trees/{id}/tasks/{taskId}")
    suspend fun updateTreeTaskStatus(
        @Path("id") id: String,
        @Path("taskId") taskId: String,
        @Body body: UpdateTaskStatusBody
    ): ApiResponse<TreeTaskDto>

    @GET("plants/search")
    suspend fun searchPlants(@Query("q") query: String): ApiResponse<PlantSearchResponse>

    @POST("plants/resolve")
    suspend fun resolvePlant(@Body body: ResolvePlantBody): ApiResponse<ResolvePlantResponse>

    @POST("vision/identify")
    suspend fun identifyPlant(@Body body: VisionRequestBody): ApiResponse<IdentifyPlantDto>

    @POST("vision/diagnose")
    suspend fun diagnosePlant(@Body body: VisionRequestBody): ApiResponse<DiagnosePlantResponseDto>

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

    @POST("seasonal/tree/{id}/materialize-tasks")
    suspend fun materializeTreeTasks(@Path("id") id: String): ApiResponse<MaterializeTasksResponse>
}
