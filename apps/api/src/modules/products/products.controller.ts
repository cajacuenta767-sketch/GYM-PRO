import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto';
import { CreateProductCategoryDto, CreateProductDto, CreateSaleDto, QueryProductsDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Tienda')
@ApiBearerAuth()
@Controller('store')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get('stats') stats() { return this.service.salesStats(); }

  @Get('categories') categories() { return this.service.findCategories(); }
  @Post('categories') createCategory(@Body() dto: CreateProductCategoryDto) { return this.service.createCategory(dto); }
  @Delete('categories/:id') removeCategory(@Param('id') id: string) { return this.service.removeCategory(id); }

  @Get('sales') sales(@Query() query: PaginationDto) { return this.service.findSales(query); }
  @Get('sales/:id') sale(@Param('id') id: string) { return this.service.findSale(id); }
  @Post('sales') createSale(@Body() dto: CreateSaleDto) { return this.service.createSale(dto); }

  @Get('products/low-stock') lowStock() { return this.service.lowStock(); }
  @Get('products') findAll(@Query() query: QueryProductsDto) { return this.service.findAll(query); }
  @Get('products/:id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post('products') create(@Body() dto: CreateProductDto) { return this.service.create(dto); }
  @Patch('products/:id') update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.service.update(id, dto); }
  @Delete('products/:id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
