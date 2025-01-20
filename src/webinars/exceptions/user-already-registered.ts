export class UserAlreadyRegisteredException extends Error {
    constructor() {
      super('User is already registered for this webinar.');
      this.name = 'UserAlreadyRegisteredException';
    }
  }
  