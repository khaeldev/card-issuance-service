import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
  Get,
} from '@nestjs/common';
import { IssueCardDto } from '../dto/issuer-card.dto';
import { IssuerService } from '../services/issuer.service';

@Controller('cards')
export class IssuerController {
  private readonly logger = new Logger(IssuerController.name);

  constructor(private readonly issuerService: IssuerService) {}

  @Post('issuer')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async issueCard(@Body() dto: IssueCardDto) {
    this.logger.log(
      `Received request to create transaction: ${JSON.stringify(dto)}`,
    );

    return await this.issuerService.createRequest(dto);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return { status: 'Issuer service is healthy' };
  }
}
