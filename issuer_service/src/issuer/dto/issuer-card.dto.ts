import {
  IsString,
  IsEmail,
  IsInt,
  IsBoolean,
  ValidateNested,
  Min,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @IsString()
  @IsEnum(['DNI', 'CE', 'PASSPORT'])
  documentType: string;

  @IsString()
  @Length(8, 12)
  documentNumber: string;

  @IsString()
  fullName: string;

  @IsInt()
  @Min(18)
  age: number;

  @IsEmail()
  email: string;
}

class ProductDto {
  @IsString()
  type: string;

  @IsString()
  currency: string;

  @IsBoolean()
  simulateError: boolean;
}

export class IssueCardDto {
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ValidateNested()
  @Type(() => ProductDto)
  product: ProductDto;
}