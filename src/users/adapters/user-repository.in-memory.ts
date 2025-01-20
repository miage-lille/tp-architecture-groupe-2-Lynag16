import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  private readonly database: User[] = []; 

  // Méthode pour trouver un utilisateur par ID
  async findById(id: string): Promise<User | null> {
    const user = this.database.find((user) => user.props.id === id);
    return user || null;
  }

  // Méthode pour enregistrer un utilisateur
  async save(user: User): Promise<void> {
    this.database.push(user); 
}
