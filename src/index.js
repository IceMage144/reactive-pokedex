import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import $ from 'jquery';

const PKM_PER_PAGE = 20;

function getJSON(url, sync=true, fn=((response) => {})) {
    return ($.ajax({
        type: 'GET',
        url: url,
        async: !sync,
        dataType: 'json',
        complete: fn,
        fail: ( jqXHR, textStatus, errorThrown ) => {
            console.log( 'Could not get posts, server response: ' + textStatus + ': ' + errorThrown );
        }
    })).responseJSON;
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class Pokedex extends React.Component {
    constructor(props) {
        super(props);
        let result = getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=0`);
        this.state = {
            offset: 0,
            pkmList: result.results,
            pkmShow: (<div className="screen"></div>),
            nextDisabled: false,
            prevDisabled: true
        };
        this.requesting = false;
        this.pkmMax = result.count;
        this.cache = { 0: result.results };
        getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${3*PKM_PER_PAGE}&offset=${PKM_PER_PAGE}`,
                false, (response) => {
            let pokemons = response.responseJSON.results;
            for (let i = 0; i < 3; i++)
                this.cache[PKM_PER_PAGE*(i+1)] = pokemons.slice(i*PKM_PER_PAGE, (i+1)*PKM_PER_PAGE);
        });
    }
    renderPokemon(pkmNum) {
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
                    </div>)
            });
        });
        this.setState({
            pkmShow: (
                <div className="screen">
                    <p>{"Loading..."}</p>
                </div>)
        });
    }
    changeList(add) {
        let nextOffset = this.state.offset + add*PKM_PER_PAGE;
        if (nextOffset > this.pkmMax) {
            console.log("Failed...");
            return;
        }
        let list = [];
        console.log(`${this.state.offset} ${nextOffset}`);
        if (nextOffset in this.cache) {
            list = this.cache[nextOffset];
            console.log(`Found ${nextOffset} at cache!`);
            let futureOffset = nextOffset + 3*PKM_PER_PAGE;
            if (futureOffset < this.pkmMax && !(futureOffset in this.cache)) {
                console.log(`Requesting ${futureOffset}...`);
                getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=${futureOffset}`,
                        false, (response) => {
                    if (!(futureOffset in this.cache)) {
                        this.cache[futureOffset] = response.responseJSON.results;
                        console.log(`${futureOffset} arrived from first request`);
                    }
                    else
                        console.log(`${futureOffset} arrived from first request and could not use`);
                });
            }
            this.setState({
                pkmList: list,
                offset: nextOffset,
                nextDisabled: (nextOffset + PKM_PER_PAGE >= this.pkmMax),
                prevDisabled: (nextOffset - PKM_PER_PAGE < 0)
            });
        }
    }
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
    render() {
        let list = []
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
            </div>);
    }
}

ReactDOM.render(
    <Pokedex />,
    document.getElementById('pokedex')
);
