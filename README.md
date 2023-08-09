
# ICP_Movie_Tracker
This is an Azle smart contract that can help you keep track of the diffrent movies that you are watching and also your personal ratings of them. This is just a simple prototype version but the plan is to incorporate advanced Web 3 features such as Artificial Intelligence(AI), Natural Language Processing(NLP) and Machine Learning(ML) to create an inteligent dApp that can tell you exactly what you'll like and where you can watch it.

# Functions List
1. getCallerID() : Gets the unique principal ID of the caller via (ic.caller()) and then converts it to a string.
2. createMovieUser(username: string, user_password: string)
3. getAllUsers()
4. getSpecificUser(id: string)
5. deleteUser(id: string)
6. LogMovie(payload: MoviePayload, user_id: string)
7. getAllMovies()
8. getOneMovie(id: string)
9. updateMovie(id: string, payload: MoviePayload)
10. removeLoggedMovie(id: string)

# RUN LOCALLY

1. Run `npm install`.
2. Make sure that you have DFX installed, if not, install from here [installation](https://demergent-labs.github.io/azle/installation.html).
3. Run `dfx start background` to get dfx started.
4. Run `dfx deploy` to deploy the code(The first time takes several minutes so please be patient).
5. You can now interact with it using the dfx cli or the web interface(link will be visible after deployment).

