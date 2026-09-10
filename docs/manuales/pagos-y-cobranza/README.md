Manual de usuario
Pagos y cobranza

El presente documento describe el uso de las pantallas de Pagos y Cobranza del módulo MDC de Zelify. Está dirigido al personal operativo responsable de consultar calendarios de crédito, cargar el archivo de nómina del periodo y dar seguimiento a los casos en los que el descuento no cubrió la cuota o no fue posible identificar al titular. No se requiere conocimiento técnico de sistemas: para operar el módulo basta con contar con acceso a la plataforma y con el archivo de Excel que entrega el área de nómina.


1. Propósito del módulo

Cuando se da de alta una solicitud de crédito, el sistema genera de manera automática el calendario de pagos. Para ello toma el plazo capturado en la solicitud y la tasa de interés del producto contratado, y arma un plan de cuotas en el que cada vencimiento queda desglosado en capital, interés y fecha. Ese calendario es la referencia de trabajo a lo largo de la vida del crédito, pues en él se observa qué se ha cubierto, qué saldo permanece abierto y cuál es el próximo vencimiento.

La operación diaria se concentra en tres momentos. En Pagos se consultan los calendarios y, al llegar el archivo de nómina, se carga el Excel para que el sistema aplique los descuentos. Si el monto no alcanza o la ficha no coincide con ningún expediente, el caso pasa a Cobranza, donde el personal contacta al titular, registra la gestión y consulta las cuotas que siguen abiertas. En síntesis, Pagos muestra qué se debe y qué ya se debitó, mientras que Cobranza concentra a las personas que deben ser localizadas porque faltó dinero o porque no se encontró coincidencia en el archivo.

Figura 1. Acceso al módulo MDC, con las pestañas Pagos y Cobranza y el selector de persona natural o persona moral.


2. Acceso a las pantallas

El usuario inicia sesión en Zelify con su cuenta institucional y abre el módulo MDC. En la parte superior de la pantalla existe un selector entre persona natural y persona moral. La distinción es relevante, porque cada vista muestra únicamente a los clientes de ese tipo: si se busca una empresa estando en persona natural, el registro no aparecerá, y lo mismo ocurre a la inversa. Una vez elegido el tipo de persona, se selecciona la pestaña Pagos o la pestaña Cobranza, según la tarea que corresponda.


3. Pantalla de Pagos

Al ingresar a Pagos se presenta, en primer lugar, un resumen del periodo. En la parte superior se muestran tarjetas con indicadores como el volumen de pagos, el nivel de éxito y el ticket promedio; debajo aparece una gráfica del movimiento de los últimos 7, 30 o 90 días, y más abajo se encuentra el listado Pagos recientes. Las tarjetas no sustituyen la revisión caso por caso: su utilidad es dar una lectura rápida del día, de modo que una baja en el porcentaje de éxito o un aumento de registros no pagados suele indicar un problema en la nómina o en el archivo cargado.

Figura 2. Vista general de la pantalla de Pagos: indicadores, gráfica y listado.

3.1 Listado de pagos recientes

Cada renglón del listado corresponde a un crédito y a su calendario. En la fila se observa la solicitud, identificada con un código corto del tipo APP-… y con el nombre del producto; el nombre del cliente, con CURP o RFC debajo; el estado del pago; el método, que en la práctica suele ser SPEI; el monto; y la fecha en que se armó el calendario. Al seleccionar un renglón se abre el detalle, que es la vista en la que se consulta el plan de cuotas y se confirma el avance del crédito.

Figura 3. Listado de pagos recientes.

3.2 Calendario de cuotas

El calendario es el recuadro central del crédito. En la parte superior se resume el total del plan, el monto ya pagado, el saldo pendiente y la fecha del próximo vencimiento; debajo se listan las cuotas una por una. En cada cuota aparecen el capital, el interés, lo debitado hasta el momento y la fecha de vencimiento. Los estados más frecuentes son Pendiente, Pagado, Parcial y Vencido.

Al cargar el Excel, el sistema no asigna el dinero a una cuota al azar: aplica el monto a la cuota abierta más antigua y continúa hacia las siguientes, en ese orden. El criterio es el mismo que se usa cuando se cubre primero un atraso y después el periodo vigente.

Figura 4. Calendario de cuotas, con desglose de capital e interés.


4. Carga del archivo de nómina

Cuando llega el archivo del periodo, la conciliación no se realiza de forma manual: el archivo se carga desde la propia pantalla de Pagos. El procedimiento consiste en pulsar Agregar pago, arrastrar el Excel a la zona indicada o elegirlo desde el equipo —solo se aceptan archivos con extensión .xlsx— y, a continuación, pulsar Subir archivo y esperar a que termine el proceso. Al concluir, el sistema informa cuántos registros quedaron pagados, cuántos quedaron parciales y cuántos se enviaron a cobranza.

Figura 5. Ventana para cargar el archivo de pagos.

4.1 Estructura del archivo

La primera fila del archivo debe contener los títulos de columna. El sistema busca, como mínimo, tres campos: FICHA, que también se admite como NUMERO_EMPLEADO_FICHA; NOMBRE; y MONTO, que en algunos formatos aparece como TESTAFIN. La ficha es la llave de coincidencia, pues se compara con la ficha extraída del expediente de nómina del titular. No debe usarse el número de solicitud ni un identificador interno, porque con esos datos el sistema no localiza el crédito. Si la ficha trae espacios de más, le faltan ceros o está escrita de forma distinta a la del expediente, el registro no se reconoce y el movimiento pasa a cobranza, aunque la persona exista en la cartera.

Figura 6. Ejemplo de columnas del archivo de nómina: FICHA, NOMBRE y MONTO.

4.2 Lectura del resultado

Cuando el archivo se procesa de forma correcta, cada renglón queda en uno de tres resultados. Queda Pagado cuando el monto cubrió lo que correspondía a esa ficha en el periodo y el calendario avanza. Queda Parcial cuando se debitó una parte, pero no alcanzó para cerrar lo pendiente: el saldo permanece abierto y se crea o se actualiza un caso de cobranza. Queda A cobranza cuando no se encontró esa ficha en los expedientes y se abre un caso para que el área lo investigue. El monto que debe ir en el archivo es el descuento de ese periodo, no el saldo total del crédito; el importe completo del préstamo solo se registra cuando el titular liquidó de una sola vez.

Figura 7. Resultado de la conciliación: registros pagados, parciales y enviados a cobranza.


5. Pantalla de Cobranza

Después de cargar el archivo se cambia a la pestaña Cobranza. El listado se actualiza de forma automática, por lo que no es necesario recargar la página de manera reiterada. En la parte superior se muestran cuatro indicadores que orientan el orden de trabajo: el número de casos, el monto vencido, los días promedio de atraso (DPD) y la cantidad de casos escalados. Debajo se encuentra la tabla, en la que es posible buscar por nombre, solicitud, número de caso o estado. Cuando el volumen es alto, conviene atender primero los casos con mayor DPD y los que ya están escalados.

Figura 8. Vista general de la pantalla de Cobranza.

5.1 Consulta de un caso

Al seleccionar un renglón se abre la ficha del caso, en la que aparecen teléfono, correo, identificación, monto adeudado y días de atraso. Si el titular ya tiene calendario, este se muestra en el mismo detalle. Esa información permite precisar la conversación, porque se puede indicar qué cuotas faltan en lugar de hablar solo de un saldo global.

Figura 9. Detalle de un caso de cobranza, con calendario de cuotas.

5.2 Registro de una nota

Toda gestión debe quedar documentada, incluso cuando solo se dejó un mensaje de voz o no hubo respuesta. La nota se agrega desde el ícono de libretita en la tabla o desde Agregar nota dentro del caso, y en el texto se describe lo ocurrido: si se localizó al titular, si no contestó, si prometió pagar en una fecha determinada u otra circunstancia relevante. Al guardar, la nota queda en el historial para quien retome el caso más adelante.

Figura 10. Registro de una nota de seguimiento.


6. Significado de los estados en pantalla

Los colores y etiquetas de la interfaz tienen un sentido operativo preciso. En el listado de Pagos, Pendiente indica que ya existe calendario y que todavía no llega el archivo del periodo, o que el descuento no alcanzó; Pagado indica que lo correspondiente a ese periodo ya quedó cubierto; En proceso significa que el movimiento aún no cierra; y No pagado señala que el cobro falló o que no hubo fondos.

En cada cuota, Pendiente significa que sigue abierta; Parcial, que ingresó dinero pero no el total; Pagado, que esa cuota ya no se modifica; y Vencido, que la fecha ya pasó y el importe sigue sin cubrirse. En Cobranza, Activo corresponde a un caso en seguimiento, mientras que Escalado se reserva para situaciones que ya no son rutinarias, porque el atraso es prolongado o el caso fue elevado de nivel. El DPD expresa los días transcurridos desde el vencimiento más antiguo que aún no se paga; un DPD más alto implica mayor urgencia de gestión.


7. Rutina recomendada para el día de nómina

Cuando el archivo de nómina llega por la mañana, se sugiere el siguiente orden de trabajo. En primer lugar se ingresa a Pagos y se verifica que las solicitudes nuevas ya tengan calendario; después se carga el archivo del periodo y, una vez procesado, se revisa el resumen para identificar los registros parciales y los no encontrados. A continuación se pasa a Cobranza y se atienden esos casos. En cada llamada, mensaje o intento de contacto se deja una nota, aunque sea breve. Al cierre del día no debería haber un caso gestionado sin una línea registrada en el historial.


8. Situaciones frecuentes

Si no aparece un titular en Pagos, conviene recordar que el calendario se genera al crear la solicitud, siempre que existan plazo y producto. En esos casos se recarga la pestaña y se confirma que el selector esté en persona natural o persona moral, según corresponda.

Cuando casi todos los renglones del archivo pasan a cobranza, la causa más habitual es la ficha: un espacio de más, un cero omitido o una nómina que todavía no está extraída en el expediente. Se recomienda comparar la ficha del archivo con la del documento de nómina.

El calendario no puede regenerarse si ya se debitó algún importe, porque el sistema no vuelve a armar el plan a fin de no perder los pagos aplicados. Si nadie ha pagado y el calendario está incorrecto, el ajuste debe solicitarse a operación o a soporte.

Si se cargó el monto total del crédito y los saldos quedaron descuadrados, debe tenerse presente que el archivo debe contener el descuento de ese periodo. El total del préstamo solo corresponde cuando hubo liquidación completa.

Si se está en persona moral y no aparecen las personas físicas, se trata del comportamiento esperado: debe cambiarse el selector de la parte superior.
