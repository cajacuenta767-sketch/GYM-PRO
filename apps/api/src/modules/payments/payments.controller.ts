import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query, RawBodyRequest, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, ModuleKey, PortalAccess, Public, Roles } from '../../common/decorators';
import type { JwtUser } from '../../common/decorators';
import { CheckoutDto, ConfirmCheckoutDto, CreatePaymentDto, QueryPaymentsDto, UpdatePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos')
@ApiBearerAuth()
@ModuleKey('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('stats') stats() { return this.service.stats(); }

  @Post('checkout') @ApiOperation({ summary: 'Crear sesión de pago en línea para un plan' })
  checkout(@Body() dto: CheckoutDto) { return this.service.createCheckout(dto); }

  @Post('checkout/confirm') @HttpCode(200) @PortalAccess() @ApiOperation({ summary: 'Confirmar pago en línea al volver de la pasarela' })
  confirm(@Body() dto: ConfirmCheckoutDto, @CurrentUser() user: JwtUser) {
    return this.service.confirmCheckout(dto.providerRef, 'RETURN', user);
  }

  @Public() @Post('webhooks/stripe') @HttpCode(200)
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig?: string) {
    return this.service.handleWebhook(req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {})), sig);
  }

  @Get(':id/invoice.pdf') @PortalAccess() @ApiOperation({ summary: 'Descargar factura en PDF' })
  async invoice(@Param('id') id: string, @CurrentUser() user: JwtUser, @Res() res: Response) {
    const p = await this.service.findOne(id);
    if (user.role === 'MEMBER' && p.memberId !== user.memberId) { res.status(403).json({ success: false, message: 'Sin acceso a esta factura' }); return; }
    const { buffer, filename } = await this.service.invoicePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  }

  @Get() findAll(@Query() query: QueryPaymentsDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() @Roles('ADMIN', 'ACCOUNTANT', 'STAFF') create(@Body() dto: CreatePaymentDto) { return this.service.create(dto); }
  @Patch(':id') @Roles('ADMIN', 'ACCOUNTANT') update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('ADMIN') remove(@Param('id') id: string) { return this.service.remove(id); }
}
