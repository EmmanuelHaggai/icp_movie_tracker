//Lets start by incorporating several depandencies which will be used by our smart contract
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
    Principal,
    Opt
  } from "azle";
  import { v4 as uuidv4 } from "uuid";

//Lets now define the Movie record type
type Movie = Record<{
    id: string;
    user_id: string;
    ic_caller_id: string;
    title: string;
    synopsis: string;
    myRatingOutOfTen: string;
    posterURL: string;
    status: string; // completed / still_watching
    resume: string; // Where we'll resume watching from in case the status is 'still_watching'
    notes: string; // Additional personal notes about the movie, if any
    created_at: nat64;
    updated_at: Opt<nat64>;
}>

//Lets now define the minimum payload data that can be passed to the update function
type MoviePayload = Record<{
    title: string;
    synopsis: string;
    myRatingOutOfTen: string;
    posterURL: string;
    status: string; // completed / still_watching
    resume: string; // Where we'll resume watching from in case the status is 'still_watching'
    notes: string; // Additional personal notes about the movie, if any
}>

// Lets define the User record type
type User = Record<{
    id: string;
    ic_caller_id: string;
    username: string;
    user_password: string;
    created_at: nat64;
    updated_at: Opt<nat64>;
}>;

// Lets define the minimum User payload data type
type UserPayload = Record<{
    id: string;
    username: string;
    user_password: string;
}>;


//Lets now create a storage variable for our movie list
const movieStorage = new StableBTreeMap<string, Movie>(0, 44, 10_000);

//Lets then create a storage type for our users
const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);

// Lets start by getting the the identity that called this function
$query;
export function getCallerID(): string {
    return ic.caller().toString();
}

//Let now create a function to create a user
$update;
export function createMovieUser(username: string, user_password: string,): Result<User, string> {
    const id = uuidv4();
    const ic_caller_id = getCallerID();
    const user: User = {
        id,
        ic_caller_id,
        username,
        user_password,
        created_at: ic.time(),
        updated_at: Opt.None
    };

    userStorage.insert(user.id, user);

    return Result.Ok(user);
}

//Lets now create a function that can be used to list all users
$query;
export function getAllUsers(): Result<Vec<User>, string> {
    return Result.Ok(userStorage.values());
}

//Next lets create a fuction that can be used to retrive a single user using their unique ID
$query;
export function getSpecificUser(id: string): Result<User, string> {
    return match(userStorage.get(id), {
        Some: (user) => Result.Ok<User, string>(user),
        None: () => Result.Err<User, string>(`A user with the ID: ${id} was not found. Please check the ID and try again.`)
    });
}

//Lets finalize the user section by creating a function to delete a user
$update;
export function deleteUser(id: string): Result<User, string> {
    return match(userStorage.remove(id), {
        Some: (removedUser) => Result.Ok<User, string>(removedUser),
        None: () => Result.Err<User, string>(`Couldn't delete a user with the ID: ${id} because the user was not found. Please check the ID and then try again.`)
    });
}

//Lets now creating a function to log a movie into our canister
$update;
export function LogMovie(payload: MoviePayload, user_id: string): Result<Movie, string> {
    const ic_caller_id = getCallerID();
    const movie: Movie = { id: uuidv4(), user_id: user_id, ic_caller_id: ic_caller_id, created_at: ic.time(), updated_at: Opt.None, ...payload };
    movieStorage.insert(movie.id, movie);
    return Result.Ok(movie);
}

// Now lets create a function that can retrive all the movies stored in our canister
$query;
export function getAllMovies(): Result<Vec<Movie>, string> {
    return Result.Ok(movieStorage.values());
}

//Let us now create a function to retrive a specific movie using its unique identifier (ID)
$query;
export function getOneMovie(id: string): Result<Movie, string> {
    return match(movieStorage.get(id), {
        Some: (movie) => Result.Ok<Movie, string>(movie),
        None: () => Result.Err<Movie, string>(`A movie with the ID: ${id} was not found. Please check the ID and try again.`)
    });
}

// Now lets create a function that can allow us to update the details of a movie that already exists in our canister
$update;
export function updateMovie(id: string, payload: MoviePayload): Result<Movie, string> {
    return match(movieStorage.get(id), {
        Some: (movie) => {
            const updatedMessage: Movie = {...movie, ...payload, updated_at: Opt.Some(ic.time())};
            movieStorage.insert(movie.id, updatedMessage);
            return Result.Ok<Movie, string>(updatedMessage);
        },
        None: () => Result.Err<Movie, string>(`Couldn't update a movie with the ID: ${id} because the movie was not found. Please check the ID and then try again.`)
    });
}

//The next step is to create a function that can help us remove a movie from our list
$update;
export function removeLoggedMovie(id: string): Result<Movie, string> {
    return match(movieStorage.remove(id), {
        Some: (removedMovie) => Result.Ok<Movie, string>(removedMovie),
        None: () => Result.Err<Movie, string>(`Couldn't delete a movie with the ID: ${id} because the movie was not found. Please check the ID and then try again.`)
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
        getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}