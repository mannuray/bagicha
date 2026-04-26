package com.bagicha.app.domain.repository

import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.CreateTreeBody
import com.bagicha.app.data.remote.PlantSearchResponse
import com.bagicha.app.data.remote.ResolvePlantBody
import com.bagicha.app.data.remote.ResolvePlantResponse
import com.bagicha.app.data.remote.SeasonalStateDto
import com.bagicha.app.data.remote.MaterializeTasksResponse
import com.bagicha.app.data.remote.MitigationPlanDto
import com.bagicha.app.data.remote.TreeTaskDto
import com.bagicha.app.data.remote.TreeCycleDto
import com.bagicha.app.data.remote.TreeDto
import com.bagicha.app.data.remote.TreeLogDto
import com.bagicha.app.data.remote.UpdateTaskStatusBody
import com.bagicha.app.data.remote.dto.ApiResponse

interface LedgerRepository {
    suspend fun createTree(body: CreateTreeBody): ApiResponse<TreeDto>
    suspend fun updateTree(id: String, body: CreateTreeBody): ApiResponse<TreeDto>
    suspend fun getTrees(): ApiResponse<List<TreeDto>>
    suspend fun getTreeDetail(id: String): ApiResponse<TreeDto>
    suspend fun getTreeSeasonalState(id: String): ApiResponse<SeasonalStateDto>
    suspend fun getTreeCycles(id: String): ApiResponse<List<TreeCycleDto>>
    suspend fun getTreeTasks(id: String): ApiResponse<List<TreeTaskDto>>
    suspend fun getUserTasks(): ApiResponse<List<TreeTaskDto>>
    suspend fun getMitigationPlan(id: String): ApiResponse<MitigationPlanDto>
    suspend fun searchPlants(query: String): ApiResponse<PlantSearchResponse>
    suspend fun resolvePlant(body: ResolvePlantBody): ApiResponse<ResolvePlantResponse>
    suspend fun getTreeTimeline(id: String, page: Int = 1, pageSize: Int = 20): ApiResponse<List<TreeLogDto>>
    suspend fun addTreeLog(id: String, body: AddLogBody): ApiResponse<TreeLogDto>
    suspend fun materializeTreeTasks(id: String): ApiResponse<MaterializeTasksResponse>
    suspend fun updateTreeTaskStatus(id: String, taskId: String, body: UpdateTaskStatusBody): ApiResponse<TreeTaskDto>
}
