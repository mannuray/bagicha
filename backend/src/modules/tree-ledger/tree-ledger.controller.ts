import { Controller, Post, Get, Body, Param, UseGuards, Request, Query, Put } from '@nestjs/common';
import { TreeLedgerService } from './tree-ledger.service';
import { CreateTreeDto } from './dto/create-tree.dto';
import { AddLogDto } from './dto/add-log.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('ledger')
@UseGuards(AuthGuard('jwt'))
export class TreeLedgerController {
  constructor(private readonly treeLedgerService: TreeLedgerService) {}

  @Post('trees')
  async createTree(@Request() req, @Body() createTreeDto: CreateTreeDto) {
    return this.treeLedgerService.createTree(req.user.id, createTreeDto);
  }

  @Get('trees')
  async getTrees(@Request() req) {
    return this.treeLedgerService.getTrees(req.user.id);
  }

  @Get('trees/:id')
  async getTreeDetail(@Request() req, @Param('id') id: string) {
    return this.treeLedgerService.getTreeDetail(req.user.id, id);
  }

  @Put('trees/:id')
  async updateTree(@Request() req, @Param('id') id: string, @Body() updateTreeDto: UpdateTreeDto) {
    return this.treeLedgerService.updateTree(req.user.id, id, updateTreeDto);
  }

  @Post('trees/:id/logs')
  async addLog(@Request() req, @Param('id') id: string, @Body() addLogDto: AddLogDto) {
    return this.treeLedgerService.addLog(req.user.id, id, addLogDto);
  }

  @Get('trees/:id/timeline')
  async getTimeline(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
  ) {
    const result = await this.treeLedgerService.getTimeline(req.user.id, id, Number(page), Number(pageSize));
    // Since our Success Interceptor handles the structure, we return the data + pagination.
    // However, the interceptor expects 'data', so we return it in a specific way that the interceptor can handle
    // for pagination cases if needed. For now, we return it as an object.
    return result;
  }
}
