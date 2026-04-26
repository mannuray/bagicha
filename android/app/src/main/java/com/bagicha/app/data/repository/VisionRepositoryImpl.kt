package com.bagicha.app.data.repository

import com.bagicha.app.data.remote.ApiService
import com.bagicha.app.data.remote.DiagnosePlantResponseDto
import com.bagicha.app.data.remote.IdentifyPlantDto
import com.bagicha.app.data.remote.VisionRequestBody
import com.bagicha.app.data.remote.dto.ApiResponse
import com.bagicha.app.domain.repository.VisionRepository
import javax.inject.Inject

class VisionRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : VisionRepository {
    override suspend fun identifyPlant(body: VisionRequestBody): ApiResponse<IdentifyPlantDto> {
        return apiService.identifyPlant(body)
    }

    override suspend fun diagnosePlant(body: VisionRequestBody): ApiResponse<DiagnosePlantResponseDto> {
        return apiService.diagnosePlant(body)
    }
}
