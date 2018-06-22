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

function firstUpper(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class Pokedex extends React.Component {
    constructor(props) {
        super(props);
        let result = getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=0`);
        this.state = {
            offset: 0,
            pkmList: result.results,
            pkmShow: (<div></div>),
            nextDisabled: false,
            prevDisabled: true
        };
        this.pkmMax = result.count;
        this.cache = { 0: result.results };
        console.log(result.results);
        getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${3*PKM_PER_PAGE}&offset=${PKM_PER_PAGE}`,
                             false, (response) => {
            let pokemons = response.responseJSON.results;
            for (let i = 0; i < 3; i++)
                this.cache[PKM_PER_PAGE*(i+1)] = pokemons.slice(i*PKM_PER_PAGE, (i+1)*PKM_PER_PAGE);
        });
    }
    renderPokemon(pkmNum) {
        if (pkmNum !== 0) {
            console.log(pkmNum);
            getJSON(this.state.pkmList[pkmNum].url, false, (response) => {
                let json = response.responseJSON;
                console.log(json);
                let types = [];
                for (let i = 0; i < json.types.length; i++)
                    types.push(<p key={i}>{json.types[i].type.name}</p>);
                this.setState({
                    pkmShow: (
                        <div>
                            <h1>{`#${json.id} ${firstUpper(json.name)}`}</h1>
                            {types}
                            <img src={json.sprites.front_default} alt={json.name}/>
                            <p>Height: {json.height}</p>
                            <p>Weight: {json.weight}</p>
                            <div>
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
                pkmShow: (<div><p>{"Loading..."}</p></div>)
            });
        }
        else {
            this.setState({
                pkmShow: (<div></div>)
            });
        }
    }
    changeList(add) {
        let nextOffset = this.state.offset + add*PKM_PER_PAGE;
        let list = []
        if (nextOffset in this.cache) {
            list = this.cache[nextOffset];
            let futureOffset = nextOffset + 3*PKM_PER_PAGE;
            if (!(futureOffset in this.cache)) {
                getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=${futureOffset}`,
                                     false, (response) => {
                    this.cache[futureOffset] = response.responseJSON.results;
                });
            }
        }
        else {
            let result = getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=${nextOffset}`);
            this.cache[nextOffset] = result.results;
        }
        this.setState({
            pkmList: list,
            offset: nextOffset,
            nextDisabled: (nextOffset + PKM_PER_PAGE >= this.pkmMax),
            prevDisabled: (nextOffset - PKM_PER_PAGE < 0)
        });
    }
    renderButton(i) {
        return (
            <li key={i}>
                <button onClick={() => this.renderPokemon(i)}>
                    {firstUpper(this.state.pkmList[i].name)}
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
                <ul>
                    {list}
                </ul>
                <button onClick={() => this.changeList(1)} disabled={this.state.nextDisabled}>Next</button>
                <button onClick={() => this.changeList(-1)} disabled={this.state.prevDisabled}>Prev</button>
                <div>{this.state.pkmShow}</div>
            </div>);
    }
}

ReactDOM.render(
    <Pokedex />,
    document.getElementById('pokedex')
);
