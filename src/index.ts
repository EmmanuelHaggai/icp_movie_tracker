import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    float64,
    Opt,
  } from "azle";
  import { v4 as uuidv4 } from "uuid";
  
  //Movie data
  type Movie = Record<{
    id: string;
    userId: string;
    title: string;
    genres: string;
    synopsis: string;
    myRatingOutOfTen: float64;
    posterURL: string;
    status: string;
    resume: string;
    notes: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
  }>;
  
  //User data
  type User = Record<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    registeredAt: nat64;
    updatedAt: Opt<nat64>;
  }>;
  
  //Movie Payload
  type MoviePayload = Record<{
    title: string;
    genres: string;
    synopsis: string;
    myRatingOutOfTen: float64;
    posterURL: string;
    status: string;
    resume: string;
    notes: string;
  }>;
  
  //User Payload
  type UserPayload = Record<{
    fullName: string;
    email: string;
    phone: string;
  }>;
  
  const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);
  const movieStorage = new StableBTreeMap<string, Movie>(1, 44, 2048);
  
  $query;
  export function getCallerId(): string {
    return ic.caller().toString();
  }
  
  function generateUUID(): string {
    return uuidv4();
  }
  
  // User functions
  $update;
  export function registerUser(payload: UserPayload): Result<User, string> {
    const id = getCallerId();
    const user: User = {
      id: id,
      registeredAt: ic.time(),
      updatedAt: Opt.None,
      ...payload,
    };
  
    const userAlredyExist = userStorage.values().filter((usr) => usr.id === id);
    if (userAlredyExist.length !== 0) {
      return Result.Err("You are already registered as a user");
    }
  
    userStorage.insert(user.id, user);
    return Result.Ok(user);
  }
  
  $query;
  export function getMyUserProfile(): Result<Vec<User>, string> {
    const profile = userStorage
      .values()
      .filter((pro) => pro.id === getCallerId());
    if (profile.length === 0) {
      return Result.Err("You are not yet registered as a user");
    }
  
    return Result.Ok(profile);
  }
  
  $update;
  export function DeleteUser(id: string): Result<User, string> {
    return match(userStorage.get(id), {
      Some: (removeUser) => {
        if (removeUser.id !== getCallerId()) {
          return Result.Err<User, string>(
            "You are not authorized to delete this user"
          );
        }
        userStorage.remove(id);
        return Result.Ok<User, string>(removeUser);
      },
      None: () =>
        Result.Err<User, string>(
          `User with ID:${id} not found. Please check the ID and try again.`
        ),
    });
  }
  
  $update;
  export function editUser(
    id: string,
    payload: UserPayload
  ): Result<User, string> {
    return match(userStorage.get(id), {
      Some: (updateUser) => {
        if (updateUser.id !== getCallerId()) {
          return Result.Err<User, string>(
            "You are not authorized to edit this user"
          );
        }
  
        const updatedUser: User = {
          id: getCallerId(),
          registeredAt: updateUser.registeredAt,
          updatedAt: Opt.Some(ic.time()),
          ...payload,
        };
  
        userStorage.insert(updateUser.id, updatedUser);
        return Result.Ok<User, string>(updatedUser);
      },
      None: () =>
        Result.Err<User, string>(
          `User with ID:${id} not found. Please check the ID and try again.`
        ),
    });
  }
  
  //Movie functions
  $update;
  export function logMovie(payload: MoviePayload): Result<Movie, string> {
    const user = userStorage.values().filter((usr) => usr.id === getCallerId());
    if (user.length === 0) {
      return Result.Err("First register as a user then try again");
    }
  
    const movie: Movie = {
      id: generateUUID(),
      userId: getCallerId(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      ...payload,
    };
    movieStorage.insert(movie.id, movie);
    return Result.Ok<Movie, string>(movie);
  }
  
  $query;
  export function getLoggedMovies(): Result<Vec<Movie>, string> {
    const movies = movieStorage
      .values()
      .filter((mvie) => mvie.userId === getCallerId());
    if (movies.length === 0) {
      return Result.Err("You have not yet logged any movies");
    }
  
    return Result.Ok(movies);
  }
  
  $update;
  export function updateMovie(
    id: string,
    payload: MoviePayload
  ): Result<Movie, string> {
    return match(movieStorage.get(id), {
      Some: (movie) => {
        if (movie.userId !== getCallerId()) {
          return Result.Err<Movie, string>(
            "You are not authorized to update this movie"
          );
        }
        const updatedMovie: Movie = {
          ...movie,
          ...payload,
          updatedAt: Opt.Some(ic.time()),
        };
        movieStorage.insert(movie.id, updatedMovie);
        return Result.Ok<Movie, string>(updatedMovie);
      },
      None: () =>
        Result.Err<Movie, string>(
          `Couldn't update a movie with the ID: ${id} because the movie was not found. Please check the movie ID and then try again.`
        ),
    });
  }
  
  $update;
  export function removeMovie(id: string): Result<Movie, string> {
    return match(movieStorage.get(id), {
      Some: (removeMovie) => {
        if (removeMovie.userId !== getCallerId()) {
          return Result.Err<Movie, string>(
            "You are not authorized to delete this movie"
          );
        }
        movieStorage.remove(id);
        return Result.Ok<Movie, string>(removeMovie);
      },
      None: () =>
        Result.Err<Movie, string>(
          `Couldn't delete a movie with the ID: ${id} because the movie was not found. Please check the ID and then try again.`
        ),
    });
  }
  
  // a workaround to make uuid package work with Azle
  globalThis.crypto = {
    getRandomValues: () => {
      let array = new Uint8Array(32);
  
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
  
      return array;
    },
  };
  