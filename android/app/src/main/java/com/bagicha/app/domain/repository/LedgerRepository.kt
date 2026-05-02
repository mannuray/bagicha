package com.bagicha.app.domain.repository

import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.CreatePlantBody
import com.bagicha.app.data.remote.PlantSearchResponse
import com.bagicha.app.data.remote.ResolvePlantBody
import com.bagicha.app.data.remote.ResolvePlantResponse
import com.bagicha.app.data.remote.SeasonalStateDto
import com.bagicha.app.data.remote.MaterializeTasksResponse
import com.bagicha.app.data.remote.MitigationPlanDto
import com.bagicha.app.data.remote.PlantTaskDto
import com.bagicha.app.data.remote.PlantCycleDto
import com.bagicha.app.data.remote.PlantDto
import com.bagicha.app.data.remote.JournalEntryDto
import com.bagicha.app.data.remote.UpdateTaskStatusBody
import com.bagicha.app.data.remote.dto.ApiResponse

interface LedgerRepository {
    suspend fun createPlant(body: CreatePlantBody): ApiResponse<PlantDto>
    suspend fun updatePlant(id: String, body: CreatePlantBody): ApiResponse<PlantDto>
    suspend fun getPlants(): ApiResponse<List<PlantDto>>
    suspend fun getPlantDetail(id: String): ApiResponse<PlantDto>
    suspend fun getPlantSeasonalState(id: String): ApiResponse<SeasonalStateDto>
    suspend fun getPlantCycles(id: String): ApiResponse<List<PlantCycleDto>>
    suspend fun getPlantTasks(id: String): ApiResponse<List<PlantTaskDto>>
    suspend fun getUserTasks(): ApiResponse<List<PlantTaskDto>>
    suspend fun getMitigationPlan(id: String): ApiResponse<MitigationPlanDto>
    suspend fun searchPlants(query: String): ApiResponse<PlantSearchResponse>
    suspend fun resolvePlant(body: ResolvePlantBody): ApiResponse<ResolvePlantResponse>
    suspend fun getPlantTimeline(id: String, page: Int = 1, pageSize: Int = 20): ApiResponse<List<JournalEntryDto>>
    suspend fun addPlantJournalEntry(id: String, body: AddLogBody): ApiResponse<JournalEntryDto>
    suspend fun materializePlantTasks(id: String): ApiResponse<MaterializeTasksResponse>
    suspend fun updatePlantTaskStatus(id: String, taskId: String, body: UpdateTaskStatusBody): ApiResponse<PlantTaskDto>
}
