package com.bagicha.app.data.repository

import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.ApiService
import com.bagicha.app.data.remote.CreateTreeBody
import com.bagicha.app.data.remote.TreeDto
import com.bagicha.app.data.remote.TreeLogDto
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

    override suspend fun getTreeTimeline(id: String, page: Int, pageSize: Int): ApiResponse<List<TreeLogDto>> {
        return apiService.getTreeTimeline(id, page, pageSize)
    }

    override suspend fun addTreeLog(id: String, body: AddLogBody): ApiResponse<TreeLogDto> {
        return apiService.addTreeLog(id, body)
    }
}
