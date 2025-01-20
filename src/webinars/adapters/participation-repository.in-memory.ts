import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { Participation } from 'src/webinars/entities/participation.entity';

export class InMemoryParticipationRepository implements IParticipationRepository {
  private readonly database: Participation[] = []; // Simulation d'une base de données en mémoire

  // Méthode pour trouver toutes les participations pour un webinaire donné
  async findByWebinarId(webinarId: string): Promise<Participation[]> {
    return this.database.filter((participation) => participation.props.webinarId === webinarId);
  }

  // Méthode pour trouver une participation spécifique par webinarId et userId
  async findByWebinarIdAndUserId(webinarId: string, userId: string): Promise<Participation | null> {
    const participation = this.database.find(
      (participation) => participation.props.webinarId === webinarId && participation.props.userId === userId
    );
    return participation || null;
  }

  // Méthode pour enregistrer une nouvelle participation
  async save(participation: Participation): Promise<void> {
    this.database.push(participation); 
  }
}
