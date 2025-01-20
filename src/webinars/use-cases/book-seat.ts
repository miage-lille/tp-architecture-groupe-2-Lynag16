import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

import { Participation } from 'src/webinars/entities/participation.entity';
import { WebinarNotEnoughSeatsException } from 'src/webinars/exceptions/webinar-not-enough-seats';
import { UserAlreadyRegisteredException } from 'src/webinars/exceptions/user-already-registered';

type Request = {
  webinarId: string;
  user: User;
};

type Response = void;

export class BookSeat implements Executable<Request, Response> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {}
  async execute({ webinarId, user }: Request): Promise<Response> {
    // Vérifier si le webinaire existe
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found'); 
    }
  
    // Vérifier si l'utilisateur est déjà inscrit
    const existingParticipation = await this.participationRepository.findByWebinarIdAndUserId(
      webinarId,
      user.props.id
    );
    if (existingParticipation) {
      throw new UserAlreadyRegisteredException();
    }
  
    // Vérifier si le webinaire a encore des places disponibles
    const participants = await this.participationRepository.findByWebinarId(webinarId);
    const remainingSeats = webinar.props.seats - participants.length;
  
    if (remainingSeats <= 0) {
      throw new WebinarNotEnoughSeatsException(); 
    }
  
    // Créer la participation de l'utilisateur
    const participation = new Participation({
      userId: user.props.id,
      webinarId: webinarId,
    });
  
    await this.participationRepository.save(participation);
  
    // Envoyer un email à l'organisateur
    const email = {
      to: webinar.props.organizerId,
      subject: `New participant for webinar: ${webinar.props.title}`,
      body: `A new participant, ${user.props.email}, has registered for your webinar.`,
    };
  
    await this.mailer.send(email);
  
    return;
  }
  
  
}
