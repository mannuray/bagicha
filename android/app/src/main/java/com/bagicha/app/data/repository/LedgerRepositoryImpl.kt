package com.bagicha.app.data.repository

import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.ApiService
import com.bagicha.app.data.remote.CreateTreeBody
import com.bagicha.app.data.remote.MaterializeTasksResponse
import com.bagicha.app.data.remote.MitigationPlanDto
import com.bagicha.app.data.remote.PlantSearchResponse
import com.bagicha.app.data.remote.ResolvePlantBody
import com.bagicha.app.data.remote.ResolvePlantResponse
import com.bagicha.app.data.remote.SeasonalStateDto
import com.bagicha.app.data.remote.TreeTaskDto
import com.bagicha.app.data.remote.TreeCycleDto
import com.bagicha.app.data.remote.TreeDto
import com.bagicha.app.data.remote.TreeLogDto
import com.bagicha.app.data.remote.UpdateTaskStatusBody
import com.bagicha.app.data.remote.dto.ApiResponse
import com.bagicha.app.domain.repository.LedgerRepository
import javax.inject.Inject

class LedgerRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : LedgerRepository {
    override suspend fun createTree(body: CreateTreeBody): ApiResponse<TreeDto> {
        return apiService.createTree(body)
    }

    override suspend fun updateTree(id: String, body: CreateTreeBody): ApiResponse<TreeDto> {
        return apiService.updateTree(id, body)
    }

    override suspend fun getTrees(): ApiResponse<List<TreeDto>> {
        return apiService.getTrees()
    }

    override suspend fun getTreeDetail(id: String): ApiResponse<TreeDto> {
        return apiService.getTreeDetail(id)
    }

    override suspend fun getTreeSeasonalState(id: String): ApiResponse<SeasonalStateDto> {
        return apiService.getTreeSeasonalState(id)
    }

    override suspend fun getTreeCycles(id: String): ApiResponse<List<TreeCycleDto>> {
        return apiService.getTreeCycles(id)
    }

    override suspend fun getTreeTasks(id: String): ApiResponse<List<TreeTaskDto>> {
        return apiService.getTreeTasks(id)
    }

    override suspend fun getUserTasks(): ApiResponse<List<TreeTaskDto>> {
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

    override suspend fun getTreeTimeline(id: String, page: Int, pageSize: Int): ApiResponse<List<TreeLogDto>> {
        return apiService.getTreeTimeline(id, page, pageSize)
    }

    override suspend fun addTreeLog(id: String, body: AddLogBody): ApiResponse<TreeLogDto> {
        return apiService.addTreeLog(id, body)
    }

    override suspend fun materializeTreeTasks(id: String): ApiResponse<MaterializeTasksResponse> {
        return apiService.materializeTreeTasks(id)
    }

    override suspend fun updateTreeTaskStatus(
        id: String,
        taskId: String,
        body: UpdateTaskStatusBody
    ): ApiResponse<TreeTaskDto> {
        return apiService.updateTreeTaskStatus(id, taskId, body)
    }
}
