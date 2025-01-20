import { BookSeat } from 'src/webinars/use-cases/book-seat';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { InMemoryParticipationRepository } from 'src/webinars/adapters/participation-repository.in-memory';
import { InMemoryUserRepository } from 'src/users/adapters/user-repository.in-memory';
import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotEnoughSeatsException } from 'src/webinars/exceptions/webinar-not-enough-seats';
import { UserAlreadyRegisteredException } from 'src/webinars/exceptions/user-already-registered';
import { Webinar } from 'src/webinars/entities/webinar.entity';


describe('BookSeat use case', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let participationRepository: InMemoryParticipationRepository;
  let userRepository: InMemoryUserRepository;
  let mailer: InMemoryMailer;
  let bookSeatUseCase: BookSeat;

  const user = new User({
    id: 'user-1',
    email: 'user@example.com',
    password: 'password123',
  });

  const webinarData = {
    id: 'webinar-1',
    organizerId: 'organizer-1',
    title: 'Webinar Title',
    seats: 2,
    startDate: new Date('2024-01-10T10:00:00.000Z'),
    endDate: new Date('2024-01-10T11:00:00.000Z'),
  };

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository();
    participationRepository = new InMemoryParticipationRepository();
    userRepository = new InMemoryUserRepository();
    mailer = new InMemoryMailer();
    bookSeatUseCase = new BookSeat(
      participationRepository,
      userRepository,
      webinarRepository,
      mailer
    );

    // Sauvegarder le webinaire dans le repository
    webinarRepository.create(new Webinar(webinarData));

    // Sauvegarder l'utilisateur dans le repository
    userRepository.save(user);
  });

  describe('Scenario: Happy Path', () => {
    it('should successfully book a seat for the user', async () => {
      await bookSeatUseCase.execute({
        webinarId: 'webinar-1',
        user,
      });

      // Vérifier que la participation a bien été enregistrée
      const participants = await participationRepository.findByWebinarId('webinar-1');
      expect(participants).toHaveLength(1);
      expect(participants[0].props.userId).toBe(user.props.id);
    });

    it('should send an email to the organizer', async () => {
      await bookSeatUseCase.execute({
        webinarId: 'webinar-1',
        user,
      });

      // Vérifier que l'email a bien été envoyé
      expect(mailer.getEmails()).toHaveLength(1);
      const sentEmail = mailer.getEmails()[0];
      expect(sentEmail.to).toBe('organizer-1');
      expect(sentEmail.subject).toBe('New participant for webinar: Webinar Title');
      expect(sentEmail.body).toBe(
        `A new participant, user@example.com, has registered for your webinar.`
      );
    });
  });

  describe('Scenario: Not Enough Seats', () => {
    it('should throw WebinarNotEnoughSeatsException if there are not enough seats available', async () => {
      // Créer un deuxième utilisateur pour tester l'excédent de places
      const user2 = new User({
        id: 'user-2',
        email: 'user2@example.com',
        password: 'password123',
      });
  
      // Réserver une place pour l'utilisateur 1
      await bookSeatUseCase.execute({
        webinarId: 'webinar-1',
        user,
      });
  
      // Réserver une place pour l'utilisateur 2 (devrait être la dernière place disponible)
      await bookSeatUseCase.execute({
        webinarId: 'webinar-1',
        user: user2,
      });
  
      // Essayer d'inscrire un utilisateur supplémentaire (devrait échouer)
      const user3 = new User({
        id: 'user-3',
        email: 'user3@example.com',
        password: 'password123',
      });
  
      await expect(
        bookSeatUseCase.execute({
          webinarId: 'webinar-1',
          user: user3,
        })
      ).rejects.toThrow(WebinarNotEnoughSeatsException);  
    });
  });
  

  describe('Scenario: User Already Registered', () => {
    it('should throw UserAlreadyRegisteredException if the user is already registered', async () => {
      // Réserver la place pour l'utilisateur
      await bookSeatUseCase.execute({
        webinarId: 'webinar-1',
        user,
      });

      // Essayer d'inscrire à nouveau le même utilisateur (devrait échouer)
      await expect(
        bookSeatUseCase.execute({
          webinarId: 'webinar-1',
          user,
        })
      ).rejects.toThrow(UserAlreadyRegisteredException);
    });
  });
});
