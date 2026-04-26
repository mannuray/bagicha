package com.bagicha.app.domain.repository

import com.bagicha.app.data.remote.DiagnosePlantResponseDto
import com.bagicha.app.data.remote.IdentifyPlantDto
import com.bagicha.app.data.remote.VisionRequestBody
import com.bagicha.app.data.remote.dto.ApiResponse

interface VisionRepository {
    suspend fun identifyPlant(body: VisionRequestBody): ApiResponse<IdentifyPlantDto>
    suspend fun diagnosePlant(body: VisionRequestBody): ApiResponse<DiagnosePlantResponseDto>
}
