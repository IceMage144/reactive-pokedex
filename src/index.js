import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import $ from 'jquery';

// Pokemons per page
const PKM_PER_PAGE = 20;

/*
 * Gets a json through "url" and returns it. This function can be executed at
 * asynchronous mode if "sync" is false and a function "fn" can be executed
 * right after the function recieves a response.
 */
function getJSON(url, sync=true, fn=((response) => {})) {
    return ($.ajax({
        type: 'GET',
        url: url,
        async: !sync,
        dataType: 'json',
        complete: fn
    })).responseJSON;
}

/*
 * Capitalizes the string "string"
 */
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/*
 * Pokedex class that is rendered at the page
 */
class Pokedex extends React.Component {
    constructor(props) {
        super(props);

        // Send a request to pokeapi to get the first page
        let result = getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=0`);
        this.state = {
            offset: 0,
            pkmList: result.results,
            pkmShow: (<div className="screen"></div>),
            nextDisabled: false,
            prevDisabled: true
        };
        this.pkmMax = result.count;
        this.cache = { 0: result.results };

        // Request more pages for caching
        getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${3*PKM_PER_PAGE}&offset=${PKM_PER_PAGE}`,
                false, (response) => {
            let pokemons = response.responseJSON.results;
            for (let i = 0; i < 3; i++)
                this.cache[PKM_PER_PAGE*(i+1)] = pokemons.slice(i*PKM_PER_PAGE, (i+1)*PKM_PER_PAGE);
        });
    }

    /*
     * Render the pokemon at the "pkmNum" position of this.state.pkmList
     */
    renderPokemon(pkmNum) {
        // Request pokemon's data
        getJSON(this.state.pkmList[pkmNum].url, false, (response) => {
            let json = response.responseJSON;
            let types = [];
            for (let i = 0; i < json.types.length; i++)
                types.push(<p key={i}>{json.types[i].type.name}</p>);
            this.setState({
                pkmShow: (
                    <div className="screen">
                        <h1>{`#${json.id} ${capitalize(json.name)}`}</h1>
                        <div className="column">
                            <div className="image-back">
                                <img src={json.sprites.front_default} alt={json.name}/>
                            </div>
                            {types}
                        </div>
                        <div className="column">
                            <p>Weight: {json.weight}</p>
                            <p>Height: {json.height}</p>
                            <p>Speed: {json.stats[0].base_stat}</p>
                            <p>Special-defense: {json.stats[1].base_stat}</p>
                            <p>Special-attack: {json.stats[2].base_stat}</p>
                            <p>Defense: {json.stats[3].base_stat}</p>
                            <p>Attack: {json.stats[4].base_stat}</p>
                            <p>HP: {json.stats[5].base_stat}</p>
                        </div>
                    </div>
                )
            });
        });

        // Add a pleceholder to indicate that no response has come yet
        this.setState({
            pkmShow: (
                <div className="screen">
                    <p>{"Loading..."}</p>
                </div>
            )
        });
    }

    /*
     * Change pokemon list to the next page if "add" equals 1 or to the
     * previous, if equal to -1
     */
    changeList(add) {
        let nextOffset = this.state.offset + add*PKM_PER_PAGE;
        if (nextOffset >= this.pkmMax || nextOffset < 0)
            return;

        // Checks if the page is at the cache, and fails to load, otherwise
        if (nextOffset in this.cache) {
            let list = this.cache[nextOffset];
            this.setState({
                pkmList: list,
                offset: nextOffset,
                nextDisabled: (nextOffset + PKM_PER_PAGE >= this.pkmMax),
                prevDisabled: (nextOffset - PKM_PER_PAGE < 0)
            });
        }

        // Load more pages to cache
        let futureOffset = nextOffset + 3*PKM_PER_PAGE;
        if (futureOffset < this.pkmMax && !(futureOffset in this.cache)) {
            getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=${futureOffset}`,
                    false, (response) => {
                if (!(futureOffset in this.cache))
                    this.cache[futureOffset] = response.responseJSON.results;
            });
        }
    }

    /*
     * Render a list button for the i-th pokemon of this.state.pkmList
     */
    renderButton(i) {
        if (!(i in this.state.pkmList))
            return (<li key={i}></li>);
        return (
            <li key={i}>
                <button onClick={() => this.renderPokemon(i)}>
                    {capitalize(this.state.pkmList[i].name)}
                </button>
            </li>
        );
    }

    /*
     * Default render method from React that renders everything
     */
    render() {
        let list = [];
        for (let i = 0; i < PKM_PER_PAGE; i++)
            list.push(this.renderButton(i));
        return (
            <div>
                <div className="list-row">
                    <div className="button-column">
                        <button onClick={() => this.changeList(-1)} disabled={this.state.prevDisabled}>{"<"}</button>
                    </div>
                    <div className="list-column">
                        <ul>
                            {list.slice(0, PKM_PER_PAGE/2)}
                        </ul>
                    </div>
                    <div className="list-column">
                        <ul>
                            {list.slice(PKM_PER_PAGE/2, PKM_PER_PAGE)}
                        </ul>
                    </div>
                    <div className="button-column">
                        <button onClick={() => this.changeList(1)} disabled={this.state.nextDisabled}>{">"}</button>
                    </div>
                </div>
                <div className="pokemon">{this.state.pkmShow}</div>
            </div>
        );
    }
}

ReactDOM.render(
    <Pokedex />,
    document.getElementById('pokedex')
);
