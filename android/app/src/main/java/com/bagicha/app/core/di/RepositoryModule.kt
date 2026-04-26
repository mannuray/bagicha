package com.bagicha.app.core.di

import com.bagicha.app.data.repository.AuthRepositoryImpl
import com.bagicha.app.data.repository.LedgerRepositoryImpl
import com.bagicha.app.data.repository.VisionRepositoryImpl
import com.bagicha.app.domain.repository.AuthRepository
import com.bagicha.app.domain.repository.LedgerRepository
import com.bagicha.app.domain.repository.VisionRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindLedgerRepository(
        ledgerRepositoryImpl: LedgerRepositoryImpl
    ): LedgerRepository

    @Binds
    @Singleton
    abstract fun bindVisionRepository(
        visionRepositoryImpl: VisionRepositoryImpl
    ): VisionRepository
}
