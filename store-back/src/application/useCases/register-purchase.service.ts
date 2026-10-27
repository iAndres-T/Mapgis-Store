import {
  AlreadyExistsException,
  InsufficientStockException,
  ResourceNotFoundException,
} from '@domain/exception';
import { Purchase } from '@domain/model';
import {
  RegisterPurchaseCommand,
  RegisterPurchaseUseCase,
} from '@application/ports/in';
import { UnitOfWorkPort } from '@application/ports/out';

export class RegisterPurchaseService extends RegisterPurchaseUseCase {
  constructor(private readonly uow: UnitOfWorkPort) {
    super();
  }

  // Orden de bloqueo: usuario → requestId → productos por id ascendente (Purchase.create ya los ordena).
  execute(command: RegisterPurchaseCommand): Promise<Purchase> {
    return this.uow.run(async ({ users, products, purchases }) => {
      const user = await users.findByIdForUpdate(command.userId);
      if (!user) throw new ResourceNotFoundException('Usuario', command.userId);

      const existing = await purchases.findByRequestId(command.requestId);
      if (existing) {
        if (existing.userId !== command.userId) {
          throw new AlreadyExistsException('La compra', command.requestId);
        }
        return existing;
      }

      const productIds = [...new Set(command.lines.map((l) => l.productId))];
      const catalog = await products.findByIds(productIds);
      const purchase = Purchase.create({ ...command, catalog });

      for (const item of purchase.items) {
        if (!(await products.decrementStock(item.productId, item.quantity))) {
          const current = await products.findById(item.productId);
          throw new InsufficientStockException(
            current?.name ?? item.productId,
            current?.stock ?? 0,
            item.quantity,
          );
        }
      }

      await purchases.save(purchase);
      if (purchase.isOnCredit()) {
        await users.increaseDebt(user.id, purchase.total);
      }
      return purchase;
    });
  }
}
