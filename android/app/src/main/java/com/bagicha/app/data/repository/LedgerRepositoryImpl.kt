package com.bagicha.app.data.repository

import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.ApiService
import com.bagicha.app.data.remote.CreatePlantBody
import com.bagicha.app.data.remote.MaterializeTasksResponse
import com.bagicha.app.data.remote.MitigationPlanDto
import com.bagicha.app.data.remote.PlantSearchResponse
import com.bagicha.app.data.remote.ResolvePlantBody
import com.bagicha.app.data.remote.ResolvePlantResponse
import com.bagicha.app.data.remote.SeasonalStateDto
import com.bagicha.app.data.remote.PlantTaskDto
import com.bagicha.app.data.remote.PlantCycleDto
import com.bagicha.app.data.remote.PlantDto
import com.bagicha.app.data.remote.JournalEntryDto
import com.bagicha.app.data.remote.UpdateTaskStatusBody
import com.bagicha.app.data.remote.dto.ApiResponse
import com.bagicha.app.domain.repository.LedgerRepository
import javax.inject.Inject

class LedgerRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : LedgerRepository {
    override suspend fun createPlant(body: CreatePlantBody): ApiResponse<PlantDto> {
        return apiService.createPlant(body)
    }

    override suspend fun updatePlant(id: String, body: CreatePlantBody): ApiResponse<PlantDto> {
        return apiService.updatePlant(id, body)
    }

    override suspend fun getPlants(): ApiResponse<List<PlantDto>> {
        return apiService.getPlants()
    }

    override suspend fun getPlantDetail(id: String): ApiResponse<PlantDto> {
        return apiService.getPlantDetail(id)
    }

    override suspend fun getPlantSeasonalState(id: String): ApiResponse<SeasonalStateDto> {
        return apiService.getPlantSeasonalState(id)
    }

    override suspend fun getPlantCycles(id: String): ApiResponse<List<PlantCycleDto>> {
        return apiService.getPlantCycles(id)
    }

    override suspend fun getPlantTasks(id: String): ApiResponse<List<PlantTaskDto>> {
        return apiService.getPlantTasks(id)
    }

    override suspend fun getUserTasks(): ApiResponse<List<PlantTaskDto>> {
        return apiService.getUserTasks()
    }

    override suspend fun getMitigationPlan(id: String): ApiResponse<MitigationPlanDto> {
        return apiService.getMitigationPlan(id)
    }

    override suspend fun searchPlants(query: String): ApiResponse<PlantSearchResponse> {
        return apiService.searchPlants(query)
    }

    override suspend fun resolvePlant(body: ResolvePlantBody): ApiResponse<ResolvePlantResponse> {
        return apiService.resolvePlant(body)
    }

    override suspend fun getPlantTimeline(id: String, page: Int, pageSize: Int): ApiResponse<List<JournalEntryDto>> {
        return apiService.getPlantTimeline(id, page, pageSize)
    }

    override suspend fun addPlantJournalEntry(id: String, body: AddLogBody): ApiResponse<JournalEntryDto> {
        return apiService.addPlantJournalEntry(id, body)
    }

    override suspend fun materializePlantTasks(id: String): ApiResponse<MaterializeTasksResponse> {
        return apiService.materializePlantTasks(id)
    }

    override suspend fun updatePlantTaskStatus(
        id: String,
        taskId: String,
        body: UpdateTaskStatusBody
    ): ApiResponse<PlantTaskDto> {
        return apiService.updatePlantTaskStatus(id, taskId, body)
    }
}
