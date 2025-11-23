import { IsUUID, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IssueCardDto } from './issuer-card.dto';

class EventMetadataDto {
  @IsDateString()
  timestamp: string;
}

// Extendemos o componemos el DTO original
export class CardRequestedEventDto extends IssueCardDto {
  @IsUUID()
  requestId: string;

  @ValidateNested()
  @Type(() => EventMetadataDto)
  metadata: EventMetadataDto;
}
