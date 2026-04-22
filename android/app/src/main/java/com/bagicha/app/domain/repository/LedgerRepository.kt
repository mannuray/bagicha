package com.bagicha.app.domain.repository

import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.CreateTreeBody
import com.bagicha.app.data.remote.SeasonalStateDto
import com.bagicha.app.data.remote.TreeDto
import com.bagicha.app.data.remote.TreeLogDto
import com.bagicha.app.data.remote.dto.ApiResponse

interface LedgerRepository {
    suspend fun createTree(body: CreateTreeBody): ApiResponse<TreeDto>
    suspend fun updateTree(id: String, body: CreateTreeBody): ApiResponse<TreeDto>
    suspend fun getTrees(): ApiResponse<List<TreeDto>>
    suspend fun getTreeDetail(id: String): ApiResponse<TreeDto>
    suspend fun getTreeSeasonalState(id: String): ApiResponse<SeasonalStateDto>
    suspend fun getTreeTimeline(id: String, page: Int = 1, pageSize: Int = 20): ApiResponse<List<TreeLogDto>>
    suspend fun addTreeLog(id: String, body: AddLogBody): ApiResponse<TreeLogDto>
}
