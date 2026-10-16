import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege uma rota com o access token: `@UseGuards(JwtAuthGuard)`. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
